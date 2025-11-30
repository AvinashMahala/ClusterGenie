# ClusterGenie — High-Level Design (HLD)

📌 Overview

ClusterGenie is a small cloud cluster management/demo platform built using a React frontend and a Go-based backend (Gin). It's intended as a demo of cluster provisioning, monitoring, autoscaling, job processing and centralized logging/metrics.

High-level goals:
- Provide a single REST API backend (core-api) that handles provisioning, diagnostics, jobs and autoscaling logic.
- Keep the frontend as a single-page app (Vite + React) that talks to the backend over REST/JSON.
- Use Kafka for async events (job events, logs) and a lightweight log consumer to push logs to Loki.
- Provide observability via Prometheus (metrics) + Grafana (dashboards), with Loki for logs.

---

## Components (summary)

- Frontend (React / Vite)
  - Serves UI and embeds Grafana dashboards
  - Communicates with core-api via REST API (/api/v1)

- Backend - core-api (Go, Gin)
  - REST API (routes defined in `backend/core-api/main.go`)
  - Services: Provisioning, Job processing, Scheduling, Monitoring, Autoscaler, Billing, Deployment, Diagnosis
  - Repositories: MySQL (persistent), Redis (caching/persistence for rate-limiter), Kafka producer/consumer
  - Internal components: WorkerPool (async job processing), LimiterManager (rate-limiter), EventHandler (incoming events from Kafka)
  - Exposes /metrics for Prometheus and observability endpoints (/observability/*)

- Kafka (Event Bus)
  - Topics used: cluster-events (events used by backend), logs.* (structured logs pushed into Kafka in dev), other topics for job/logging

- Log consumer (backend/log-consumer)
  - Kafka consumer that receives log messages and pushes structured streams to Loki
  - Adds labels job_id and trace_id for easy correlation in Grafana

- Database and caches
  - MySQL — primary datastore (migrations exist under database/migrations)
  - Redis — used for rate limiter and redis-backed caches (autoscaler demo)

- Monitoring stack
  - Prometheus — scrapes core-api /metrics and provides recording rules/alerts
  - Grafana — pre-provisioned dashboards & Explore; embeds in frontend via VITE_GRAFANA_URL
  - Loki + vector — logs storage & ingestion; log-consumer pushes logs into Loki

- Orchestration / Local Developer setup
  - Docker Compose used for spinning up core-api, MySQL, Redis, Kafka, Prometheus, Grafana, Loki and log-consumer
  - Start scripts and dev helpers in repo root (start.sh, stop.sh, monitoring debug helpers)

---

## HLD Diagram (Mermaid)

Below is a high-level mermaid diagram showing actors and major infrastructure components and their interactions.

```mermaid
flowchart LR
  subgraph User
    Browser(User GUI)
  end

  subgraph Frontend[Frontend (React/Vite)]
    Browser -->|HTTP REST| API[core-api REST API]
    Browser -->|Embed| Grafana[Grafana (dashboards)]
  end

  subgraph Backend[core-api (Go)]
    API --> DB[MySQL]
    API --> Redis[Redis]
    API -->|produce events| Kafka[(Kafka)]
    API -->|expose metrics /metrics| Prometheus
    API -->|expose observability APIs| Observability
    API -->|submit background jobs| WorkerPool
    WorkerPool -->|process jobs| JobService
  end

  Kafka -->|cluster-events| BackendConsumer[core-api consumer]
  Kafka -->|logs.*| LogConsumer[log-consumer]
  LogConsumer -->|push| Loki[Loki]

  subgraph Monitoring[Monitoring Stack]
    Prometheus -->|query /metrics| API
    Prometheus -->|alerts/recording rules| Alerting
    Grafana -->|datasources| Prometheus
    Grafana -->|datasources| Loki
  end

  Note[Note: Docker Compose orchestrates DB / Redis / Kafka / Prometheus / Grafana / Loki / core-api / log-consumer] --- Backend
```

ASCII version: `docs/architecture/diagrams/HLD_ascii.txt` (useful for quick terminal viewing or editors without Mermaid rendering)

---

## Key REST touchpoints
- /api/v1/droplets, /api/v1/clusters → provisioning and cluster management
- /api/v1/jobs → create/list/get jobs (job processing uses worker pool and emits Kafka events)
- /api/v1/diagnosis/diagnose → diagnosis service (AI-simulated insights)
- /metrics → Prometheus scrape endpoint
- /observability/* → limiter & workerpool status (runtime observability)

---

## Operational notes
- Configuration is environment-driven (env vars such as KAFKA_BROKERS, MYSQL_HOST, REDIS_ADDR, API_PORT, VITE_API_URL etc.).
- Worker pool / limiter and Kafka brokers are configurable via env vars; graceful shutdown is supported.
- The repo contains local-dev scripts and monitoring configuration in `monitoring/*` for quick local runs.

---

## Next steps I will take (LLD)
I will now produce Low-Level Design diagrams and documentation showing detailed data flows and component internals (backend service responsibilities, database schema highlights, rate-limiter internals, event flow, log pipeline). 

