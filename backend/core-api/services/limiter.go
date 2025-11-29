package services

import (
	"context"
	"fmt"
	"math"
	"strconv"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// TokenBucket is a simple token-bucket rate limiter used for route throttling.
type TokenBucket struct {
	mu         sync.Mutex
	tokens     float64
	capacity   float64
	refillRate float64 // tokens per second
	last       time.Time
}

// NewTokenBucket creates a bucket with refillRate tokens per second and a max capacity.
func NewTokenBucket(refillRate float64, capacity float64) *TokenBucket {
	return &TokenBucket{
		tokens:     capacity,
		capacity:   capacity,
		refillRate: refillRate,
		last:       time.Now(),
	}
}

// Allow attempts to consume count tokens. Returns true if allowed.
func (tb *TokenBucket) Allow(count int) bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(tb.last).Seconds()
	if elapsed > 0 {
		tb.tokens += elapsed * tb.refillRate
		if tb.tokens > tb.capacity {
			tb.tokens = tb.capacity
		}
		tb.last = now
	}

	if tb.tokens >= float64(count) {
		tb.tokens -= float64(count)
		return true
	}

	return false
}

// Status returns the approximate available tokens and configuration.
func (tb *TokenBucket) Status() (available float64, capacity float64, refillRate float64) {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	// refresh tokens before reporting
	now := time.Now()
	elapsed := now.Sub(tb.last).Seconds()
	if elapsed > 0 {
		tb.tokens += elapsed * tb.refillRate
		if tb.tokens > tb.capacity {
			tb.tokens = tb.capacity
		}
		tb.last = now
	}

	return tb.tokens, tb.capacity, tb.refillRate
}

// LimiterManager holds named token buckets for the application.
// BucketConfig holds default settings for creating scoped buckets.
type BucketConfig struct {
	RefillRate float64
	Capacity   float64
}

// LimiterManager supports named buckets with optional scopes (e.g. user:123 or cluster:abc)
// RateLimiter is a generic interface used by both in-memory token buckets
// and redis-backed scoped token buckets.
type RateLimiter interface {
	Allow(count int) bool
	Status() (available float64, capacity float64, refillRate float64)
}

type LimiterManager struct {
	mu         sync.RWMutex
	buckets    map[string]map[string]RateLimiter // name -> scope -> bucket
	configs    map[string]BucketConfig           // default configs per name
	redis      *redis.Client
	redisTTLMS int64 // ttl for redis keys in milliseconds
}

// NewLimiterManager optionally accepts a redis client. If redis is non-nil,
// the manager can create Redis-backed scoped buckets for distributed rate limiting.
func NewLimiterManager(redisClient *redis.Client) *LimiterManager {
	lm := &LimiterManager{
		buckets:    make(map[string]map[string]RateLimiter),
		configs:    make(map[string]BucketConfig),
		redis:      redisClient,
		redisTTLMS: 60000, // default redis key TTL to keep state for 60s of idle
	}
	return lm
}

// Add registers a default (global) bucket for name
func (m *LimiterManager) Add(name string, bucket RateLimiter) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.buckets[name] == nil {
		m.buckets[name] = make(map[string]RateLimiter)
	}
	m.buckets[name][""] = bucket
	// don't introspect the implementation for defaults; use AddDefaultConfig if needed
}

// RedisTokenBucket implements RateLimiter backed by Redis using an atomic Lua script
type RedisTokenBucket struct {
	client     *redis.Client
	key        string
	capacity   float64
	refillRate float64
	ttlMS      int64
}

// NewRedisTokenBucket constructs a new RedisTokenBucket using the given redis client.
func NewRedisTokenBucket(client *redis.Client, name string, scope string, refillRate float64, capacity float64, ttlMS int64) *RedisTokenBucket {
	key := fmt.Sprintf("limiter:%s:%s", name, scope)
	return &RedisTokenBucket{client: client, key: key, capacity: capacity, refillRate: refillRate, ttlMS: ttlMS}
}

// Lua script does atomic token refill and consume
const redisTokenBucketLua = `local key=KEYS[1]
local capacity=tonumber(ARGV[1])
local refill=tonumber(ARGV[2])
local now=tonumber(ARGV[3])
local req=tonumber(ARGV[4])
local ttl=tonumber(ARGV[5])
local vals=redis.call('HMGET', key, 'tokens', 'last')
local tokens = tonumber(vals[1])
if tokens == nil then tokens = capacity end
local last = tonumber(vals[2])
if last == nil then last = now end
local elapsed = (now - last)/1000.0
tokens = math.min(capacity, tokens + elapsed * refill)
if tokens >= req then
  tokens = tokens - req
  redis.call('HMSET', key, 'tokens', tokens, 'last', now)
  redis.call('PEXPIRE', key, ttl)
  return {1, tostring(tokens)}
else
  return {0, tostring(tokens)}
end`

// Allow checks and consumes count tokens atomically in Redis.
func (r *RedisTokenBucket) Allow(count int) bool {
	ctx := context.Background()
	now := time.Now().UnixMilli()
	res, err := r.client.Eval(ctx, redisTokenBucketLua, []string{r.key}, fmt.Sprintf("%f", r.capacity), fmt.Sprintf("%f", r.refillRate), fmt.Sprintf("%d", now), fmt.Sprintf("%d", count), fmt.Sprintf("%d", r.ttlMS)).Result()
	if err != nil {
		// fallback deny on error
		return false
	}
	// result expected as array {1/0, tokens}
	if arr, ok := res.([]interface{}); ok && len(arr) >= 1 {
		// first element may be int64 or string
		switch v := arr[0].(type) {
		case int64:
			return v == 1
		case int:
			return v == 1
		case string:
			return v == "1"
		case []uint8:
			return string(v) == "1"
		}
	}
	return false
}

// Status reads stored tokens and computes current value (best-effort)
func (r *RedisTokenBucket) Status() (available float64, capacity float64, refillRate float64) {
	ctx := context.Background()
	vals, err := r.client.HMGet(ctx, r.key, "tokens", "last").Result()
	if err != nil {
		return 0, r.capacity, r.refillRate
	}
	var tokens float64
	var lastMs int64
	if vals[0] != nil {
		switch t := vals[0].(type) {
		case string:
			if f, err := strconv.ParseFloat(t, 64); err == nil {
				tokens = f
			}
		case float64:
			tokens = t
		case int64:
			tokens = float64(t)
		}
	} else {
		tokens = r.capacity
	}
	if vals[1] != nil {
		switch l := vals[1].(type) {
		case string:
			if n, err := strconv.ParseInt(l, 10, 64); err == nil {
				lastMs = n
			}
		case int64:
			lastMs = l
		case float64:
			lastMs = int64(l)
		}
	} else {
		lastMs = time.Now().UnixMilli()
	}
	now := time.Now().UnixMilli()
	elapsed := float64(now-lastMs) / 1000.0
	available = math.Min(r.capacity, tokens+elapsed*r.refillRate)
	return available, r.capacity, r.refillRate
}

// AddDefaultConfig registers config used when creating scoped buckets dynamically
func (m *LimiterManager) AddDefaultConfig(name string, cfg BucketConfig) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.configs[name] = cfg
}

// Get returns the global bucket (scope "") for name
func (m *LimiterManager) Get(name string) RateLimiter {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if scopes, ok := m.buckets[name]; ok {
		return scopes[""]
	}
	return nil
}

// GetOrCreate returns the bucket for name and scope; creates one using default config if missing.
func (m *LimiterManager) GetOrCreate(name string, scope string) RateLimiter {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.buckets[name] == nil {
		m.buckets[name] = make(map[string]RateLimiter)
	}
	if b, ok := m.buckets[name][scope]; ok {
		return b
	}
	// create using configured defaults if present, otherwise fall back to sensible defaults
	cfg := m.configs[name]
	if cfg.Capacity == 0 {
		cfg = BucketConfig{RefillRate: 0.2, Capacity: 5}
	}
	// If redis client is available, create a Redis-backed bucket
	if m.redis != nil {
		// If redis contains explicit limiter config for this name+scope use it
		ctx := context.Background()
		configKey := fmt.Sprintf("limiter_config:%s:%s", name, scope)
		vals, err := m.redis.HGetAll(ctx, configKey).Result()
		if err == nil && len(vals) > 0 {
			// parse refill_rate and capacity if present
			if v, ok := vals["refill_rate"]; ok {
				if f, err := strconv.ParseFloat(v, 64); err == nil {
					cfg.RefillRate = f
				}
			}
			if v, ok := vals["capacity"]; ok {
				if f, err := strconv.ParseFloat(v, 64); err == nil {
					cfg.Capacity = f
				}
			}
		} else {
			// try global config key for the name
			configKey = fmt.Sprintf("limiter_config:%s:global", name)
			vals2, err2 := m.redis.HGetAll(ctx, configKey).Result()
			if err2 == nil && len(vals2) > 0 {
				if v, ok := vals2["refill_rate"]; ok {
					if f, err := strconv.ParseFloat(v, 64); err == nil {
						cfg.RefillRate = f
					}
				}
				if v, ok := vals2["capacity"]; ok {
					if f, err := strconv.ParseFloat(v, 64); err == nil {
						cfg.Capacity = f
					}
				}
			}
		}

		rb := NewRedisTokenBucket(m.redis, name, scope, cfg.RefillRate, cfg.Capacity, m.redisTTLMS)
		m.buckets[name][scope] = rb
		return rb
	}

	b := NewTokenBucket(cfg.RefillRate, cfg.Capacity)
	m.buckets[name][scope] = b
	return b
}

// Snapshot returns a shallow map of name->scope->token status for observability
// SnapshotStatus returns available token information for each named bucket and scope.
func (m *LimiterManager) SnapshotStatus() map[string]map[string]struct {
	Available float64
	Capacity  float64
	Refill    float64
} {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make(map[string]map[string]struct {
		Available float64
		Capacity  float64
		Refill    float64
	})
	for name, scopes := range m.buckets {
		out[name] = make(map[string]struct {
			Available float64
			Capacity  float64
			Refill    float64
		})
		for scope, bucket := range scopes {
			avail, cap, rate := bucket.Status()
			out[name][scope] = struct {
				Available float64
				Capacity  float64
				Refill    float64
			}{Available: avail, Capacity: cap, Refill: rate}
			// Note: available tokens returned separately when exposing metrics
			_ = avail
		}
	}
	return out
}
