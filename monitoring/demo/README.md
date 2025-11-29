# ClusterGenie Monitoring Demo

This folder contains a minimal Grafana dashboard for quick playback/demo.

How to run the demo:

1. Start services (prometheus + grafana + core-api):

```bash
docker-compose up -d prometheus grafana core-api
```

Note for local development / testing: the default `prometheus.yml` in this repo is configured to scrape `host.docker.internal:8080` (the host machine) so Prometheus can collect metrics from a backend running locally (e.g. `air`), rather than requiring a `core-api` container. If you run `core-api` as a Docker service and want Prometheus to scrape the container directly, update `monitoring/prometheus/prometheus.yml` to use `core-api:8080` as the target.

2. Open Grafana at http://localhost:3001 (default admin/admin).
3. Import the minimal dashboard (uid `cg-minimal`) is pre-provisioned under `monitoring/grafana/dashboards/clustergenie_minimal_dashboard.json`.
4. Simulate load:
   - Create several jobs via POST /api/v1/jobs (use different X-User-ID header values) and see worker queue length and job latency in Grafana.
   - To trigger rate-limit rejects, either lower the env var `CLUSTERGENIE_JOBS_RATE`/`CLUSTERGENIE_JOBS_CAP` or use the API to set a per-user limiter config via the UI or POST /api/v1/observability/ratelimit/config.

Tips for demo scenes:
- Pre-fill limiter rules for a test user to demonstrate rejects and show the changed metric on Grafana.
- Use the embedded dashboard in the Monitoring panel to show live metrics for a chosen cluster or user.

Demo script:

- There's a small demo helper at `monitoring/demo/demo.sh` which will seed a persisted limiter rule for a user and send job create requests to the API to generate metrics for Prometheus/Grafana.
- Example: run the script to flood the API as user `alice` (adjust count/rate):

```bash
./monitoring/demo/demo.sh alice 100 50
```

Advanced generator: there's a Go-based load generator in `monitoring/demo/loadgen` that can simulate large volumes of mixed traffic with configurable concurrency and QPS. See `monitoring/demo/loadgen/README.md` for usage.
New: full demo script — `monitoring/demo/demo_full.sh`

This script runs a more comprehensive demo that:
 - Creates multiple demo clusters
 - Calls `/metrics` for each cluster so the backend seeds DB-backed metrics
 - Seeds per-user limiter configs
 - Submits a large number of jobs across different users/clusters/job types (generates job queue, queued/completed/fail metrics and histograms)
 - Calls the diagnosis endpoint rapidly to generate rate-limit events and rejections

Usage example (adjust values to taste):

```bash
# API URL (default http://localhost:8080/api/v1)
./monitoring/demo/demo_full.sh http://localhost:8080/api/v1 200 150 8 6
```

Note: demo_full.sh uses `jq` and `curl`. Make the script executable:

```bash
chmod +x monitoring/demo/demo_full.sh
```

Run the script after you've started Prometheus + Grafana + core-api (see above). The script should quickly populate metrics and you can open Grafana (http://localhost:3001) to see dashboards update.


This will create 100 jobs at roughly 50 req/s as user alice which should trigger rate-limit rejects depending on your limiter config.
