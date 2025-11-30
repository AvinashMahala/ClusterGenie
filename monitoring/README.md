# Monitoring (ClusterGenie)

This directory contains monitoring and observability configuration for ClusterGenie (Prometheus, Grafana, dashboards, rules). It contains quick notes to help developers get a working local monitoring stack.

## Files of interest
- `prometheus/` — Prometheus config, recording/alerting rules, and a short README with run & verification steps. See `prometheus/README.md` for details.
- `grafana/` — Grafana provisioning and dashboards for local development (pre-provisioned data sources and dashboards).
	- NOTE: Grafana is now provisioned with a Loki datasource and a minimal logs dashboard (see `monitoring/grafana/provisioning/datasources/loki.yml` and `monitoring/grafana/dashboards/clustergenie_logs_dashboard.json`). This helps Explore and dashboard log panels work out-of-the-box in dev.

	## Jobs dashboard: logs + metrics correlation

	Newly added in this branch is a richer dashboard which combines Prometheus metrics and Loki logs for job workflows and failures:

	- `monitoring/grafana/dashboards/clustergenie_jobs_workflow_dashboard.json` — a combined dashboard showing job throughput, failures, latency (p95) and Core API logs (Loki). Use the dashboard's Job type and status variables to filter metrics, and the Job ID / Trace ID text fields to correlate specific logs with metric spikes.

	Tips for combining logs + metrics:
	- Use `job_id` or `trace_id` fields in log messages (Core API emits these in structured JSON) — in Explore or dashboard log panels, use `| json` then filter by `job_id` or `trace_id` to narrow results.
	- The dashboard also includes a new Prometheus recording rule `clustergenie_job_failures_rate_by_type` so failure-rate queries are precomputed and efficient.
	 - The log pipeline now includes `job_id` and `trace_id` as Loki labels (via `log-consumer`), so Grafana can filter logs by these labels quickly. Dashboards were updated to allow clicking a log entry to pre-populate `job_id`/`trace_id` variables on the Jobs dashboard for fast correlation.
	 - New Prometheus recording rules and alerts were added to help detect job failure spikes by `job_type` and by `cluster_id`. See `monitoring/prometheus/rules/prometheus_rules.yml`.

## Quick start (dev)

This repo includes a `docker-compose.yml` service that launches Prometheus and Grafana and exposes Prometheus at http://localhost:9090 and Grafana at http://localhost:3001 (mapped to container port 3000).

Prometheus has been configured to be flexible for local development. See `prometheus/prometheus.yml` and `prometheus/README.md` for details.

Below are step-by-step checks and troubleshooting tips so you can quickly verify the monitoring stack and diagnose why a graph might be empty.

## Notes about host vs container targets
- Docker Desktop (macOS) exposes `host.docker.internal` by default and containers can use that to reach services running on the host.
- For convenience the `docker-compose.yml` has an `extra_hosts` entry for the `prometheus` service so the container can resolve the host at `host.docker.internal` and also `localhost` (mapped to the host gateway). This makes it easier to test Prometheus scrapes when the backend (`core-api`) is running on the host.

WARNING: the `localhost` mapping to the host is intended for local development only — it changes what `localhost` resolves to inside the container and can behave differently across platforms. Use with caution in developer environments.

---

If you prefer a different dev flow (for instance, using only `host.docker.internal` and avoiding `localhost` remapping), tell me and I will update the compose config and docs accordingly.

---

## Step-by-step verification & troubleshooting

### 1) Start only the monitoring stack

Bring up just prometheus and grafana for speed (or start the full stack if needed):

```bash
docker-compose up -d prometheus grafana
docker-compose ps
```

Example: both containers should show `Up` and the web UI ports should be bound to your host.

### 2) Confirm Prometheus targets and scrape status

- Open Prometheus targets page: http://localhost:9090/targets
- The `clustergenie-core` job should appear with targets like: `host.docker.internal:8080`, `core-api:8080`, `localhost:8080` depending on your layout.
- Verify the state is `UP`. If `DOWN`, click the target and read the "Scrape error" — it will usually contain the root cause (timeout, connect refused, TLS error, 404 from the path, etc.).

From the host you can also test scraping directly:

```bash
# from host
curl -sS http://localhost:8080/metrics | head -n 60

# inside the Prometheus container (test host reachability when prometheus runs in Docker)
docker-compose exec prometheus curl -sS host.docker.internal:8080/metrics | head -n 60
```

If the `/metrics` endpoint returns an HTML page or an error (instead of raw prometheus metrics lines), the backend might not be serving metrics correctly.

### 3) Check Prometheus logs and configuration

- Check logs for configuration parsing errors or scrape problems:


### Grafana panel examples & useful queries

Here are a few example queries and panel suggestions to use in Grafana. These are small, copy/paste-friendly queries that work well inside Grafana's query editor:

- Request rate (by path):
	- Query: sum by (path) (rate(clustergenie_http_requests_total[1m]))
	- Panel type: Time series or stat + sparkline

- Request rate (by status):
	- Query: sum by (status) (rate(clustergenie_http_requests_total[1m]))
	- Panel type: Time series stacked or pie/legend for last value

- P95 job processing latency (single line):
	- Query: histogram_quantile(0.95, sum(rate(clustergenie_job_processing_seconds_bucket[5m])) by (le))
	- Panel type: Gauge or time series

- P95 job processing latency broken down by job_type:
	- Query: histogram_quantile(0.95, sum(rate(clustergenie_job_processing_seconds_bucket[5m])) by (le, job_type))
	- Panel type: Time series with one line per job_type

- Worker queue length and active workers (combine in one panel):
	- Query A: clustergenie_workerpool_queue_length
	- Query B: clustergenie_workerpool_active_workers
	- Panel: Time series with 2 axes or one stacked chart

- Rate limiter hits per endpoint:
	- Query: sum by (endpoint) (rate(clustergenie_rate_limit_exceeded_total[5m]))
	- Panel type: Time series or table for top endpoints

Grafana tips:
- Keep label selectors minimal in dashboards — high-cardinality labels (e.g. user IDs) will create lots of series and can make panels slow or empty if the query is too specific.
- Use `sum()` and `by()` to aggregate down to a stable set of series. For instance, `sum by (path) (rate(...))` aggregates periods across methods and statuses so panels show meaningful trends.
- Temporary debug: use `Instant` queries for single-value inspection (e.g., the latest p95 value) and `Time series` queries for trends.
```bash
docker-compose logs prometheus --tail=200
```

- Confirm Prometheus loaded your `prometheus.yml` by visiting:

http://localhost:9090/status

Check the `Configuration` tab for the currently loaded config file.

### 4) Confirm recording rules and alerts

- Visit http://localhost:9090/rules to make sure recording rules are active. If your dashboard depends on `clustergenie_job_processing_seconds_p95` (a recorded rule), verify it's marked `ACTIVE` and has a recent evaluation time.

### 5) Check Grafana datasource & dashboards

- Grafana UI is at http://localhost:3001. If you see a login prompt, the repo enables anonymous viewing in dev by default.
- Confirm Grafana has a Prometheus datasource (provisioned) by visiting: http://localhost:3001/settings/datasources and inspect the Prometheus entry.
- Open a provided dashboard (e.g. the clustergenie minimal dashboard) and check each panel's query. In some cases an incorrect metric name or high-cardinality labels will cause no data to show in panels.

### 6) Verify a simple metric and a corresponding graph

1. Query `clustergenie_http_requests_total` in Prometheus UI -> Graph. If you see no series, make the backend emit a request (eg: curl the API) and re-query.
2. Use a metric with rate(): `rate(clustergenie_http_requests_total[1m])` and run for 5m range so you can see a line.

### 7) If graphs still show empty data

- Ensure the correct time range is selected in the Prometheus / Grafana graph (sometimes the default range is empty).
- Confirm Prometheus's `scrape_interval` is short enough for your environment (defaults in the repo are 5s).
- Confirm the metric labels used in the dashboard or recording rules match what's exported by `/metrics` (label mismatches cause zero series).

### Useful debug commands (quick checklist)

```bash
# Test direct scraping
curl -sS http://localhost:8080/metrics | head -n 40

# From prometheus container
docker-compose exec prometheus curl -sS host.docker.internal:8080/metrics | head -n 40

# Check prometheus logs for scrape / config problems
docker-compose logs prometheus --tail=200

# Inspect prometheus target & status page
open http://localhost:9090/targets

# Inspect recorded rules and evaluation state
open http://localhost:9090/rules

# Grafana: browse to UI (http://localhost:3001) and inspect panels / query editor
open http://localhost:3001
```

---

If you want I can add a `monitoring/debug.sh` helper script that runs the basic checks automatically (curl targets, docker-compose ps/logs, and queries a short set of prometheus endpoints). Want me to add that script?