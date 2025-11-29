package services

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

func TestRedisTokenBucketAllowAndStatus(t *testing.T) {
	ctx := context.Background()
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	client := redis.NewClient(&redis.Options{Addr: redisAddr})
	if err := client.Ping(ctx).Err(); err != nil {
		t.Skipf("Redis not available on %s - skipping integration test", redisAddr)
	}

	// set persistent config for test scope
	cfgKey := "limiter_config:test:user:alice"
	_ = client.HSet(ctx, cfgKey, map[string]interface{}{"capacity": "5", "refill_rate": "1.0"})

	m := NewLimiterManager(client)
	b := m.GetOrCreate("test", "user:alice")
	if b == nil {
		t.Fatalf("expected bucket returned")
	}

	// status should reflect capacity 5
	_, cap, rate := b.Status()
	if cap < 4.9 || cap > 5.1 {
		t.Fatalf("expected capacity ~5, got %f", cap)
	}
	if rate < 0.9 || rate > 1.1 {
		t.Fatalf("expected rate ~1.0, got %f", rate)
	}

	// consume a token
	if !b.Allow(1) {
		t.Fatalf("expected allow 1 token")
	}

	// if we consume 5 tokens quickly, subsequent allows may be denied
	for i := 0; i < 4; i++ {
		_ = b.Allow(1)
	}

	// next should be denied immediately
	if b.Allow(1) {
		t.Fatalf("expected deny when exhausted")
	}

	// wait a little for refill
	time.Sleep(1100 * time.Millisecond)

	if !b.Allow(1) {
		t.Fatalf("expected allow after refill")
	}
}
