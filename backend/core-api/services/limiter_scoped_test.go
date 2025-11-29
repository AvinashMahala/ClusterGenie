package services

import (
	"testing"
)

func TestLimiterGetOrCreateScopedBuckets(t *testing.T) {
	m := NewLimiterManager(nil)
	// default config for name
	m.AddDefaultConfig("test", BucketConfig{RefillRate: 1.0, Capacity: 2.0})

	b1 := m.GetOrCreate("test", "user:alice")
	if b1 == nil {
		t.Fatalf("expected bucket created for user:alice")
	}

	b2 := m.GetOrCreate("test", "user:alice")
	if b1 != b2 {
		t.Fatalf("expected same bucket for repeated GetOrCreate")
	}

	b3 := m.GetOrCreate("test", "cluster:xyz")
	if b3 == nil {
		t.Fatalf("expected bucket for cluster:xyz created")
	}
}
