# ClusterGenie Monitoring Demo

This folder contains a minimal Grafana dashboard for quick playback/demo.

How to run the demo:

1. Start services (prometheus + grafana + core-api):

```bash
docker-compose up -d prometheus grafana core-api
```

2. Open Grafana at http://localhost:3000 (default admin/admin).
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

This will create 100 jobs at roughly 50 req/s as user alice which should trigger rate-limit rejects depending on your limiter config.
