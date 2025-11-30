# Monitoring (ClusterGenie)

This directory contains monitoring and observability configuration for ClusterGenie (Prometheus, Grafana, dashboards, rules). It contains quick notes to help developers get a working local monitoring stack.

## Files of interest
- `prometheus/` — Prometheus config, recording/alerting rules, and a short README with run & verification steps. See `prometheus/README.md` for details.
- `grafana/` — Grafana provisioning and dashboards for local development (pre-provisioned data sources and dashboards).

## Quick start (dev)
- The repo includes a `docker-compose.yml` service that will launch Prometheus and Grafana and will ``expose Prometheus on http://localhost:9090`` when using `docker-compose up`.
- Prometheus has been configured to be flexible for local development. See `prometheus/prometheus.yml` and `prometheus/README.md` for details.

## Notes about host vs container targets
- Docker Desktop (macOS) exposes `host.docker.internal` by default and containers can use that to reach services running on the host.
- For convenience the `docker-compose.yml` has an `extra_hosts` entry for the `prometheus` service so the container can resolve the host at `host.docker.internal` and also `localhost` (mapped to the host gateway). This makes it easier to test Prometheus scrapes when the backend (`core-api`) is running on the host.

WARNING: the `localhost` mapping to the host is intended for local development only — it changes what `localhost` resolves to inside the container and can behave differently across platforms. Use with caution in developer environments.

---

If you prefer a different dev flow (for instance, using only `host.docker.internal` and avoiding `localhost` remapping), tell me and I will update the compose config and docs accordingly.