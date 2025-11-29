package services

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

// TestRedisTokenBucketSharedAcrossInstances demonstrates that two independent
// LimiterManager instances sharing the same Redis client see a shared quota
// (i.e. token consumption is atomic across instances).
func TestRedisTokenBucketSharedAcrossInstances(t *testing.T) {
	ctx := context.Background()
	client := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	if err := client.Ping(ctx).Err(); err != nil {
		t.Skip("Redis not available on localhost:6379 - skipping integration test")
	}

	// pre-seed config for the shared scope: capacity 3, refill 0.5 tokens/sec
	cfgKey := "limiter_config:shared_test:user:bob"
	_ = client.HSet(ctx, cfgKey, map[string]interface{}{"capacity": "3", "refill_rate": "0.5"})

	// create two independent LimiterManager objects as if they were separate
	// service instances but using the same Redis server.
	m1 := NewLimiterManager(client)
	m2 := NewLimiterManager(client)

	b1 := m1.GetOrCreate("shared_test", "user:bob")
	if b1 == nil {
		t.Fatalf("expected bucket from m1")
	}
	b2 := m2.GetOrCreate("shared_test", "user:bob")
	if b2 == nil {
		t.Fatalf("expected bucket from m2")
	}

	// Initially capacity is ~3 — consume tokens using m1
	if !b1.Allow(1) {
		t.Fatalf("m1 expected to allow first token")
	}
	if !b1.Allow(1) {
		t.Fatalf("m1 expected to allow second token")
	}

	// m2 should see the same shared state — allow one more token (3rd)
	if !b2.Allow(1) {
		t.Fatalf("m2 expected to allow third token")
	}

	// Now the shared bucket should be exhausted — both instances should deny
	if b1.Allow(1) || b2.Allow(1) {
		t.Fatalf("expected denies from both instances when exhausted")
	}

	// Wait for refill (0.5 tokens/sec) — after ~2s we expect >=1 token
	time.Sleep(2200 * time.Millisecond)

	// One instance should be able to consume the returned token
	if !(b1.Allow(1) || b2.Allow(1)) {
		t.Fatalf("expected at least one instance to allow after refill")
	}
}
