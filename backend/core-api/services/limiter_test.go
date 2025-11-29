package services

import (
	"testing"
	"time"
)

func TestTokenBucketBasic(t *testing.T) {
	// 2 tokens per second, capacity 2
	tb := NewTokenBucket(2.0, 2.0)

	// Initially full
	if ok := tb.Allow(2); !ok {
		t.Fatalf("expected first two tokens to be allowed")
	}

	if ok := tb.Allow(1); ok {
		t.Fatalf("expected third token to be rejected")
	}

	// wait half a second -> should have ~1 token
	time.Sleep(550 * time.Millisecond)
	if ok := tb.Allow(1); !ok {
		t.Fatalf("expected token to refill after wait")
	}
}
