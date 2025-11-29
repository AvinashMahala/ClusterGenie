Load Generator for ClusterGenie

This small Go load generator is intended to produce realistic concurrent traffic (job creation, diagnosis requests, and other API calls) to populate Prometheus/Grafana dashboards for demo/playback.

Prerequisites:
- Go toolchain (go 1.20+)

Build & run:

```bash
cd monitoring/demo/loadgen
go run ./
```

Flags:
- -api string (default http://localhost:8080/api/v1)
- -c int concurrency workers (default 20)
- -qps int approximate global requests/second
- -jobs int total number of job creation requests
- -diag int total number of diagnosis requests
- -users int simulated users
- -clusters int simulated clusters
- -duration string max duration (e.g. 1m)

Example:
```bash
go run ./ -api http://localhost:8080/api/v1 -c 40 -qps 500 -jobs 2000 -diag 1500 -users 12 -clusters 8 -duration 1m
```
