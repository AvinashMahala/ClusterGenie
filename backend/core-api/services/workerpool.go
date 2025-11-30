package services

import (
	"sync"
	"sync/atomic"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/logger"
)

// WorkerPool processes job IDs using a pool of goroutines and a queue backed by a channel.
type WorkerPool struct {
	queue       chan string
	workerCount int32
	active      int32
	stopCh      chan struct{}
	running     int32
	handler     func(jobID string)
	mu          sync.Mutex
	queued      []string
}

// NewWorkerPool creates a worker pool with numWorkers and queueSize. handler(jobID) will be called by workers.
func NewWorkerPool(numWorkers int, queueSize int, handler func(jobID string)) *WorkerPool {
	if numWorkers <= 0 {
		numWorkers = 2
	}
	if queueSize <= 0 {
		queueSize = 100
	}
	wp := &WorkerPool{
		queue:       make(chan string, queueSize),
		workerCount: int32(numWorkers),
		active:      0,
		stopCh:      make(chan struct{}),
		handler:     handler,
	}
	return wp
}

// Start launches the worker goroutines.
func (w *WorkerPool) Start() {
	if !atomic.CompareAndSwapInt32(&w.running, 0, 1) {
		return
	}
	for i := 0; i < int(w.workerCount); i++ {
		go w.workerLoop(i)
	}
	logger.Infof("WorkerPool started with %d workers and queue size %d", w.workerCount, cap(w.queue))
}

func (w *WorkerPool) workerLoop(id int) {
	for {
		select {
		case <-w.stopCh:
			return
		case jobID := <-w.queue:
			atomic.AddInt32(&w.active, 1)
			// call the handler, but protect with recover
			func() {
				defer atomic.AddInt32(&w.active, -1)
				defer func() {
					if r := recover(); r != nil {
						logger.Errorf("worker %d recovered from panic: %v", id, r)
					}
				}()
				// allow handler to run
				// remove job id from the queued list (best-effort)
				w.mu.Lock()
				for i, v := range w.queued {
					if v == jobID {
						w.queued = append(w.queued[:i], w.queued[i+1:]...)
						break
					}
				}
				w.mu.Unlock()

				if w.handler != nil {
					w.handler(jobID)
				}
			}()
		}
	}
}

// Stop signals workers to shutdown.
func (w *WorkerPool) Stop(timeout time.Duration) {
	if !atomic.CompareAndSwapInt32(&w.running, 1, 0) {
		return
	}
	close(w.stopCh)
	// give some time for workers to finish
	if timeout > 0 {
		time.Sleep(timeout)
	}
}

// Submit enqueues a jobID. If the queue is full, returns false.
func (w *WorkerPool) Submit(jobID string) bool {
	select {
	case w.queue <- jobID:
		// track queued id for visualization
		w.mu.Lock()
		defer w.mu.Unlock()
		w.queued = append(w.queued, jobID)
		return true
	default:
		return false
	}
}

// QueueLength returns current items in queue.
func (w *WorkerPool) QueueLength() int {
	return len(w.queue)
}

// QueueCapacity returns the maximum number of items the queue can buffer.
func (w *WorkerPool) QueueCapacity() int {
	return cap(w.queue)
}

// ActiveWorkers returns the number of active workers processing jobs.
func (w *WorkerPool) ActiveWorkers() int32 {
	return atomic.LoadInt32(&w.active)
}

// WorkerCount returns configured worker count.
func (w *WorkerPool) WorkerCount() int32 {
	return w.workerCount
}

// SnapshotQueue returns a copy of queued job IDs (best-effort). It is thread-safe.
func (w *WorkerPool) SnapshotQueue() []string {
	w.mu.Lock()
	defer w.mu.Unlock()
	out := make([]string, len(w.queued))
	copy(out, w.queued)
	return out
}
