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

- `clustergenie_http_requests_total`
- `rate(clustergenie_http_requests_total[1m])`
- `histogram_quantile(0.95, sum(rate(clustergenie_job_processing_seconds_bucket[5m])) by (le))`

If you still see empty graphs after confirming the target is `UP`, confirm that the metric you're querying exists on the `/metrics` endpoint and that the time range selected in the Prometheus graph is appropriate.

---

If you'd like, I can also add these notes to a central `monitoring/README.md` or update the docker-compose to explicitly add `localhost` host aliases for easier local testing. Let me know which you'd prefer.