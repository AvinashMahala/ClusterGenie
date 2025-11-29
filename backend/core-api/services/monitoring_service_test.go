package services

import (
	"testing"
	"time"
)

func TestGenerateMetricID_UniqueWhenClusterEmpty(t *testing.T) {
	ts := time.Now()
	id1 := generateMetricID("", "cpu", ts)
	id2 := generateMetricID("", "cpu", ts)
	if id1 == id2 {
		t.Fatalf("expected unique ids for empty cluster, got same: %s", id1)
	}
}

func TestGenerateMetricID_SameWhenClusterPresent(t *testing.T) {
	ts := time.Now()
	id1 := generateMetricID("cluster-x", "cpu", ts)
	id2 := generateMetricID("cluster-x", "cpu", ts)
	if id1 != id2 {
		t.Fatalf("expected same id when cluster provided and timestamp matches, got %s and %s", id1, id2)
	}
}
