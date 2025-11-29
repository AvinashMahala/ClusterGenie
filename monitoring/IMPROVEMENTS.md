# Monitoring Improvements — ClusterGenie

This file documents improvements for Prometheus metrics generation and Grafana dashboards so the Monitoring UI and Grafana reports are more useful and robust.

## Summary of changes already applied
- Added Go runtime and Process collectors to provide runtime/process-level metrics (goroutines, GC, memory, fds, etc.).
- Added HTTP request instrumentation metrics:
  - `clustergenie_http_requests_total{method, path, status}` (counter)
  - `clustergenie_http_request_duration_seconds{method, path, status}` (histogram)
  These help chart request rates and latency distributions across the service.
- Tuned job processing histogram buckets (`clustergenie_job_processing_seconds`) to a more meaningful set for job durations: 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60.

Files changed:
- `backend/core-api/services/metrics.go` — new HTTP metrics and tuned histogram buckets; registered Go/process collectors
- `backend/core-api/main.go` — Gin middleware added to capture HTTP request metrics (records path using route template when available to reduce cardinality)

## Additional recommendations (next improvements)
1. Reduce label cardinality
   - Avoid labels with high-cardinality values (e.g. arbitrary user IDs or unique job IDs). Use coarse labels like `scope_type=user|cluster|global` and only keep `scope_id` when it's a small set of known values. Consider providing aggregated metrics (by scope_type only) and avoid adding `scope_id` everywhere.

2. HTTP path labeling
   - We record `path` as the route template (via `FullPath()` when available) to avoid different labels for `/jobs/1` vs `/jobs/2`. Keep this practice for all instrumented routes or sanitize dynamic segments.

3. Export cluster/droplet metrics to Prometheus
   - The app stores per-cluster metrics in a DB for the frontend. To make those easier for Grafana and Prometheus to query, export them as Prometheus metrics:
     - Option A: Add an internal exporter endpoint that converts recent DB metrics into Prometheus-friendly gauges with labels `cluster_id`, `metric_type`.
     - Option B: Push per-cluster/droplet metrics to a Pushgateway or instrument exporters on each droplet and let Prometheus scrape them directly.

4. Recording rules & alerts
   - Add Prometheus recording rules for expensive or repeated queries, e.g. p95 job latency:
     - `clustergenie_job_processing_seconds_p95 = histogram_quantile(0.95, sum(rate(clustergenie_job_processing_seconds_bucket[5m])) by (le))`
   - Add alerting rules for:
     - High job queue lengths
     - Rate limiter exceedances for a given scope (unexpected spikes)
     - High CPU/memory/disk for cluster nodes

5. Dashboard improvements
   - Provide dedicated panels for HTTP errors (4xx / 5xx) and latency percentiles (p50/p90/p95/p99).
   - Top-k panels using `topk(10, sum(rate(clustergenie_rate_limit_exceeded_total[5m])) by (scope_id))` to show noisy users/clusters.
   - Use template variables (cluster_id, job_type, endpoint) for interactive dashboards.

6. Security & access
   - For production, restrict access to `/metrics` or use network policies — Prometheus should be allowed to scrape, but public access to internal metrics should be considered carefully.

## How to test locally / validate
1. Start dev stack (existing repo/demo instructions):

```bash
# from repo root
# bring up prometheus, grafana and core-api via docker-compose demo
docker-compose up -d prometheus grafana core-api
# or run backend locally and rely on host.docker.internal target
air # (or go run backend/core-api/main.go)
```

2. Ensure `/metrics` is reachable

- Browse Prometheus scrape target: http://localhost:9090/targets (should list `host.docker.internal:8080` or `core-api:8080`)
- Visit `http://localhost:8080/metrics` — you should see:
  - clustergenie_http_request_duration_seconds_bucket, _sum, _count
  - clustergenie_http_requests_total
  - clustergenie_workerpool_queue_length, etc.
  - go_ and process_ metrics (from Go/Process collectors)

3. Trigger sample traffic

- From the frontend `http://localhost:5173` interact with API (create jobs, visit endpoints) to generate traffic and job processing samples.

4. Validate in Grafana

- Open Grafana at the configured port (default documented in repo: http://localhost:3001)
- Import / open the provided dashboards (monitoring/grafana/dashboards/*) or explore new metrics in the Graph/Explore UI.

5. Example useful PromQL queries

- HTTP request rate (per route):
  - sum(rate(clustergenie_http_requests_total[1m])) by (path, status)
- P95 job processing latency:
  - histogram_quantile(0.95, sum(rate(clustergenie_job_processing_seconds_bucket[5m])) by (le))
- Worker queue length:
  - clustergenie_workerpool_queue_length
- Rate limiter hits (global):
  - sum(rate(clustergenie_rate_limit_exceeded_total[1m])) by (endpoint)

## If you want me to continue
- I can add a small exporter that converts the DB-backed cluster metrics into Prometheus gauges and register them so Grafana can display per-cluster CPU/memory charts directly.
 - I added a cluster metrics exporter (backend/core-api/services/metrics_exporter.go) which periodically reads DB-stored cluster metrics and exports them as `clustergenie_cluster_metric_value{cluster_id,metric_type,unit}` gauges.
 - I also added recording rules & alerts (monitoring/prometheus/rules/prometheus_rules.yml) and mounted them into the local Prometheus container so you can experiment with p95, rate-limiter, and queue alerts.
 - Finally, a more advanced concurrent load generator (`monitoring/demo/loadgen`) is included for realistic demo traffic.
- I can add recording rules and example alerts to `monitoring/prometheus/` for p95, job queue high alerts and provide a Grafana dashboard refresh.

---
If you'd like I can: implement the DB-to-Prometheus exporter, add alerts/recording rules, or update Grafana dashboards to visualize the new HTTP metrics. Tell me which you'd like next and I’ll proceed.