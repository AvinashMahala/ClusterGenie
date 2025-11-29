package services

import (
    "github.com/prometheus/client_golang/prometheus"
)

var (
    RateLimitExceeded = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "clustergenie_rate_limit_exceeded_total",
            Help: "Total number of requests rejected by rate limiter",
        }, []string{"endpoint", "scope_type", "scope_id"},
    )

    RateLimitAvailable = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{
            Name: "clustergenie_rate_limit_available_tokens",
            Help: "Available tokens in token buckets",
        }, []string{"endpoint", "scope_type", "scope_id"},
    )

    WorkerPoolQueueLength = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "clustergenie_workerpool_queue_length",
            Help: "Current length of the job worker pool queue",
        },
    )
    WorkerPoolActiveWorkers = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "clustergenie_workerpool_active_workers",
            Help: "Number of workers currently processing jobs",
        },
    )
    WorkerPoolCount = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "clustergenie_workerpool_worker_count",
            Help: "Configured number of workers in the pool",
        },
    )

    JobsProcessed = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "clustergenie_jobs_processed_total",
            Help: "Jobs processed by status",
        }, []string{"status"},
    )
)

func RegisterPrometheusMetrics() {
    prometheus.MustRegister(RateLimitExceeded)
    prometheus.MustRegister(RateLimitAvailable)
    prometheus.MustRegister(WorkerPoolQueueLength)
    prometheus.MustRegister(WorkerPoolActiveWorkers)
    prometheus.MustRegister(WorkerPoolCount)
    prometheus.MustRegister(JobsProcessed)
}
