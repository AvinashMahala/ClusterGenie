package services

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

// TestRedisTokenBucketSharedAcrossInstancesConcurrent verifies that concurrent
// clients using separate LimiterManager instances sharing Redis have atomic
// token consumption and don't allow over-consumption.
func TestRedisTokenBucketSharedAcrossInstancesConcurrent(t *testing.T) {
	ctx := context.Background()
	client := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	if err := client.Ping(ctx).Err(); err != nil {
		t.Skip("Redis not available on localhost:6379 - skipping integration test")
	}

	cfgKey := "limiter_config:concurrent_test:user:charlie"
	_ = client.HSet(ctx, cfgKey, map[string]interface{}{"capacity": "5", "refill_rate": "0.0"})

	m1 := NewLimiterManager(client)
	m2 := NewLimiterManager(client)

	b1 := m1.GetOrCreate("concurrent_test", "user:charlie")
	b2 := m2.GetOrCreate("concurrent_test", "user:charlie")

	// We'll perform many concurrent Allow(1) attempts across both instances
	totalAttempts := 50
	var allowed int64 = 0
	var mu sync.Mutex

	var wg sync.WaitGroup
	for i := 0; i < totalAttempts; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			// alternate instances to simulate separate services
			var ok bool
			if i%2 == 0 {
				ok = b1.Allow(1)
			} else {
				ok = b2.Allow(1)
			}
			if ok {
				mu.Lock()
				allowed++
				mu.Unlock()
			}
		}(i)
	}

	wg.Wait()

	// Allowed should not exceed capacity (5)
	if allowed > 5 {
		t.Fatalf("expected at most 5 allows, got %d", allowed)
	}

	// Sleep to verify no auto refill (refill_rate 0.0)
	time.Sleep(500 * time.Millisecond)
	if b1.Allow(1) || b2.Allow(1) {
		t.Fatalf("unexpected allow after exhaustion when refill_rate=0")
	}
}
