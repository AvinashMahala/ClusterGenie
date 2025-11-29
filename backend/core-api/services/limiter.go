package services

import (
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
	m.configs[name] = BucketConfig{RefillRate: bucket.refillRate, Capacity: bucket.capacity}
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
