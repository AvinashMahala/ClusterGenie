# Prometheus configuration (ClusterGenie)

This README explains how Prometheus is configured for local development and docker-compose, and how to verify whether Prometheus can scrape the core-api app.

## Scrape targets
The `prometheus.yml` contains a `clustergenie-core` scrape job configured to fetch `/metrics` from the app. For local development it now includes three targets:

- `host.docker.internal:8080` — useful when Prometheus is running on the host (macOS Docker Desktop) and the backend is served from the host.
- `core-api:8080` — useful when Prometheus runs inside docker-compose and can reach the `core-api` container by its service name.
- `localhost:8080` — useful when both Prometheus and core-api are running on the host (non-containerized).

Keeping all three makes development easier because Prometheus can scrape the backend in most developer workflows.

## How to run & verify

### 1) Using docker-compose (recommended for full stack)

Start services:

```bash
docker-compose up -d prometheus core-api
```

Open Prometheus UI (targets):

- http://localhost:9090/targets

Check that `clustergenie-core` target is `UP` and last scrape shows recent timestamps. If a target is `DOWN`, click it and inspect the scrape error.

### 2) Running backend on host and Prometheus on host

If you run core-api locally (e.g. `go run ./backend` or using the `air` dev tool), Prometheus should be able to scrape `localhost:8080` or `host.docker.internal:8080` (macOS Docker Desktop). Example quick check:

```bash
# backend metrics reachable from host
curl -sS http://localhost:8080/metrics | head -n 40
```

### 3) Running Prometheus inside docker-compose but backend locally

If Prometheus is inside Docker and your backend runs on the host, `host.docker.internal:8080` on macOS or Docker Desktop is often required — this config is included. From inside the prometheus container you can test:

```bash
# exec into prometheus container and curl the backend using container DNS
docker-compose exec prometheus curl -sS host.docker.internal:8080/metrics | head -n 40
```

### 4) Reload/restart Prometheus after config changes

When you modify `monitoring/prometheus/prometheus.yml` you need Prometheus to reload config:

- If running in docker-compose: restart the container

```bash
docker-compose restart prometheus
```

- If you run Prometheus locally and the reload endpoint is enabled, request a reload:

```bash
curl -X POST http://localhost:9090/-/reload
```

### 5) Useful Prometheus metrics to validate

Base metrics exported by the backend service (examples)

- `clustergenie_http_requests_total{method, path, status}` — counter of HTTP requests broken down by method, route template and status.
- `rate(clustergenie_http_requests_total[1m])` — request rate per second (useful for graphs showing traffic).
- `clustergenie_http_request_duration_seconds{method, path, status}` — histogram of HTTP request latencies (use histogram_quantile for p95/p99).

- `clustergenie_job_processing_seconds_bucket{job_type, status, le}` — histogram buckets for job durations; use histogram_quantile to get p50/p95/p99.
- `clustergenie_job_processing_seconds_count` and `_sum` — standard histogram count and sum parts useful for averages.

- `clustergenie_jobs_processed_total{status}` — counter of processed jobs (status labels: success/failure/..).

- `clustergenie_rate_limit_exceeded_total{endpoint,scope_type,scope_id}` — counters for rate-limit rejections per endpoint/scope.
- `clustergenie_rate_limit_available_tokens{endpoint,scope_type,scope_id}` — gauge of available tokens in the limiter.

- Worker pool metrics:
	- `clustergenie_workerpool_queue_length` — current queue length (gauge)
	- `clustergenie_workerpool_active_workers` — number of active workers (gauge)
	- `clustergenie_workerpool_worker_count` — configured worker pool size (gauge)

- Cluster metrics exported from DB: `clustergenie_cluster_metric_value{cluster_id,metric_type,unit}` — time series per cluster metric (gauge)

Standard Go runtime & process collectors are also available by default:

- `go_goroutines`, `go_memstats_alloc_bytes`, `go_threads`, `process_cpu_seconds_total`, `process_open_fds` etc.

### Helpful example queries (quick copy/paste)

- Total requests across all endpoints (rate):
	- rate(clustergenie_http_requests_total[1m])

- Requests per path (1m rate):
	- sum by (path) (rate(clustergenie_http_requests_total[1m]))

- Errors per path (4xx/5xx) — example for HTTP 500s:
	- sum by (path) (rate(clustergenie_http_requests_total{status=~"5.."}[5m]))

- P95 job processing latency overall (5m window):
	- histogram_quantile(0.95, sum(rate(clustergenie_job_processing_seconds_bucket[5m])) by (le))

- P95 job latency broken down by job_type:
	- histogram_quantile(0.95, sum(rate(clustergenie_job_processing_seconds_bucket[5m])) by (le, job_type))

- Average job duration (using sum/count over 5m):
	- sum(rate(clustergenie_job_processing_seconds_sum[5m])) / sum(rate(clustergenie_job_processing_seconds_count[5m]))

- Rate limiter spikes (endpoints receiving limit hits):
	- sum by (endpoint) (rate(clustergenie_rate_limit_exceeded_total[5m]))

- Current available tokens per limiter endpoint (per scope):
	- clustergenie_rate_limit_available_tokens

- Worker pool health over time:
	- clustergenie_workerpool_queue_length
	- clustergenie_workerpool_active_workers

- Cluster custom metric (example: cpu usage gauge per cluster):
	- clustergenie_cluster_metric_value{metric_type="cpu_usage"}

- Go runtime / process quick checks:
	- go_goroutines
	- rate(process_cpu_seconds_total[5m])

If you're building panels in Grafana, try the `sum by (path)` or `sum by (job_type)` variants to keep panels compact and reduce series cardinality.

If you still see empty graphs after confirming the target is `UP`, confirm that the metric you're querying exists on the `/metrics` endpoint and that the time range selected in the Prometheus graph is appropriate.

## Troubleshooting (common causes when graphs are empty)

- Scrape target unreachable / network mismatch: if Prometheus runs in a container it cannot resolve `localhost` on the host unless `host.docker.internal` or an `extra_hosts` mapping is used — see the top-level `docker-compose.yml` and `monitoring/README.md`.
- Wrong `metrics_path` or endpoint path: ensure `metrics_path` is `/metrics` in `prometheus.yml` and the backend exposes that path. If your app mounts Prometheus handler at a different path, update `prometheus.yml`.
- Metrics not registered or zero samples: check the backend logs to ensure collector registration completed (no AlreadyRegisteredError) and the runtime emitted meaningful values. A newly started app with no requests may show few metrics.
- Label mismatches or cardinality: dashboards may query a metric with label filters that don't match any series returned by `/metrics` (e.g., route templates differ). Try the base metric name without labels to confirm data exists.
- Time range / query window: make sure the graph time range covers when the metric was produced. Use a longer range to surface low-frequency events.

## Quick debug checklist / commands

```bash
# from the host: inspect metrics directly
curl -sS http://localhost:8080/metrics | head -n 40

# from prometheus container: verify it can reach the host
docker-compose exec prometheus curl -sS host.docker.internal:8080/metrics | head -n 40

# check prometheus logs for scrape errors or configuration problems
docker-compose logs prometheus --tail=200

# use the Prometheus UI to inspect targets & rules
# http://localhost:9090/targets
# http://localhost:9090/rules

# check a simple Prometheus query in the UI
# 'clustergenie_http_requests_total' or 'rate(clustergenie_http_requests_total[1m])'
```

## Extra tips

- Temporarily shorten `scrape_interval` in `prometheus.yml` during iterative testing to see metrics faster.
- If a recording rule like `clustergenie_job_processing_seconds_p95` is missing from the rules page, ensure `prometheus_rules.yml` is mounted correctly and Prometheus restarted.
- When in doubt, paste the `/metrics` output here and I can point out mismatches to the dashboard queries or rules.

---

If you'd like, I can also add these notes to a central `monitoring/README.md` or update the docker-compose to explicitly add `localhost` host aliases for easier local testing. Let me know which you'd prefer.