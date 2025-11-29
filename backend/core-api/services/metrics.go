package services

import (
	"log"

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

	// Observe job processing durations (seconds)
	// Observe job processing durations (seconds)
	// Use tighter buckets tuned for expected job durations so histogram_quantile queries are more meaningful.
	JobProcessingSeconds = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "clustergenie_job_processing_seconds",
			Help: "Histogram of job processing durations in seconds",
			Buckets: []float64{
				0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60,
			},
		}, []string{"job_type", "status"},
	)

	// HTTP / REST observability
	HTTPRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "clustergenie_http_request_duration_seconds",
			Help:    "HTTP request latencies in seconds",
			Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5},
		}, []string{"method", "path", "status"},
	)

	HTTPRequestTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "clustergenie_http_requests_total",
			Help: "Total number of HTTP requests received",
		}, []string{"method", "path", "status"},
	)

	// DB-backed cluster metrics exporter (gauge values per cluster/type)
	ClusterMetricGauge = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "clustergenie_cluster_metric_value",
			Help: "DB-backed cluster metric value (labels: cluster_id, metric_type, unit)",
		}, []string{"cluster_id", "metric_type", "unit"},
	)
)

func RegisterPrometheusMetrics() {
	// Register Go runtime and process collectors so we get useful runtime/process metrics.
	// These may already be registered (hot reload or tests), so handle "already registered" safely.
	if err := prometheus.Register(prometheus.NewGoCollector()); err != nil {
		if _, ok := err.(prometheus.AlreadyRegisteredError); !ok {
			log.Printf("failed to register go collector: %v", err)
		}
	}
	if err := prometheus.Register(prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{})); err != nil {
		if _, ok := err.(prometheus.AlreadyRegisteredError); !ok {
			log.Printf("failed to register process collector: %v", err)
		}
	}

	// Helper: register and, if already registered, reuse the existing collector
	tryRegisterCounterVec := func(target **prometheus.CounterVec, candidate *prometheus.CounterVec, name string) {
		if err := prometheus.Register(candidate); err != nil {
			if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
				if existing, ok2 := are.ExistingCollector.(*prometheus.CounterVec); ok2 {
					*target = existing
				} else {
					log.Printf("unexpected existing collector type for %s: %T", name, are.ExistingCollector)
				}
			} else {
				log.Printf("failed to register %s: %v", name, err)
			}
		}
	}

	tryRegisterGaugeVec := func(target **prometheus.GaugeVec, candidate *prometheus.GaugeVec, name string) {
		if err := prometheus.Register(candidate); err != nil {
			if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
				if existing, ok2 := are.ExistingCollector.(*prometheus.GaugeVec); ok2 {
					*target = existing
				} else {
					log.Printf("unexpected existing collector type for %s: %T", name, are.ExistingCollector)
				}
			} else {
				log.Printf("failed to register %s: %v", name, err)
			}
		}
	}

	tryRegisterGauge := func(target *prometheus.Gauge, candidate prometheus.Gauge, name string) {
		if err := prometheus.Register(candidate); err != nil {
			if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
				// existing collector should satisfy prometheus.Gauge
				if existing, ok2 := are.ExistingCollector.(prometheus.Gauge); ok2 {
					*target = existing
				} else {
					log.Printf("unexpected existing collector type for %s: %T", name, are.ExistingCollector)
				}
			} else {
				log.Printf("failed to register %s: %v", name, err)
			}
		}
	}

	tryRegisterCounterVec(&RateLimitExceeded, RateLimitExceeded, "clustergenie_rate_limit_exceeded_total")
	tryRegisterGaugeVec(&RateLimitAvailable, RateLimitAvailable, "clustergenie_rate_limit_available_tokens")
	// Gauges (single)
	tryRegisterGauge(&WorkerPoolQueueLength, WorkerPoolQueueLength, "clustergenie_workerpool_queue_length")
	tryRegisterGauge(&WorkerPoolActiveWorkers, WorkerPoolActiveWorkers, "clustergenie_workerpool_active_workers")
	tryRegisterGauge(&WorkerPoolCount, WorkerPoolCount, "clustergenie_workerpool_worker_count")

	tryRegisterCounterVec(&JobsProcessed, JobsProcessed, "clustergenie_jobs_processed_total")

	if err := prometheus.Register(JobProcessingSeconds); err != nil {
		if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
			if existing, ok2 := are.ExistingCollector.(*prometheus.HistogramVec); ok2 {
				JobProcessingSeconds = existing
			} else {
				log.Printf("unexpected existing collector type for job processing seconds: %T", are.ExistingCollector)
			}
		} else {
			log.Printf("failed to register job processing histogram: %v", err)
		}
	}

	// register HTTP metrics
	if err := prometheus.Register(HTTPRequestDuration); err != nil {
		if are, ok := err.(prometheus.AlreadyRegisteredError); ok {
			if existing, ok2 := are.ExistingCollector.(*prometheus.HistogramVec); ok2 {
				HTTPRequestDuration = existing
			} else {
				log.Printf("unexpected existing collector type for http request duration: %T", are.ExistingCollector)
			}
		} else {
			log.Printf("failed to register http request duration histogram: %v", err)
		}
	}
	tryRegisterCounterVec(&HTTPRequestTotal, HTTPRequestTotal, "clustergenie_http_requests_total")

	// register cluster metric exporter gauge
	tryRegisterGaugeVec(&ClusterMetricGauge, ClusterMetricGauge, "clustergenie_cluster_metric_value")
}
