package services

import (
	"sync"
	"testing"
	"time"
)

func TestWorkerPoolProcessesJobs(t *testing.T) {
	processed := make([]string, 0)
	mu := sync.Mutex{}

	handler := func(jobID string) {
		// simulate short work
		time.Sleep(50 * time.Millisecond)
		mu.Lock()
		processed = append(processed, jobID)
		mu.Unlock()
	}

	wp := NewWorkerPool(3, 10, handler)
	wp.Start()
	defer wp.Stop(100 * time.Millisecond)

	// submit 6 jobs
	for i := 0; i < 6; i++ {
		ok := wp.Submit("j-" + string('A'+i))
		if !ok {
			t.Fatalf("expected submit to succeed")
		}
	}

	// wait for processing
	time.Sleep(500 * time.Millisecond)

	mu.Lock()
	count := len(processed)
	mu.Unlock()

	if count != 6 {
		t.Fatalf("expected 6 jobs processed, got %d", count)
	}
}

func TestWorkerPoolQueueSnapshot(t *testing.T) {
	handler := func(jobID string) {
		// immediate return
	}

	wp := NewWorkerPool(2, 10, handler)
	wp.Start()
	defer wp.Stop(100 * time.Millisecond)

	ids := []string{"one", "two", "three"}
	for _, id := range ids {
		ok := wp.Submit(id)
		if !ok {
			t.Fatalf("expected submit to succeed for %s", id)
		}
	}

	// snapshot should include submitted ids
	snap := wp.SnapshotQueue()
	if len(snap) != len(ids) {
		t.Fatalf("expected snapshot len %d got %d", len(ids), len(snap))
	}
}
