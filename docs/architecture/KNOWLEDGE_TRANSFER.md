# ClusterGenie — Knowledge Transfer Document (KTD)

Purpose: This file collects complete end-to-end knowledge for ClusterGenie — architecture, data flows (UI → API → DB/Kafka/Redis → monitoring), event formats, payload examples, runtime configuration, and an operations runbook for debugging and testing. It is designed for an engineer onboarding to the project and should be treated as the canonical transfer document.

Last updated: 2025-11-29

---

Table of contents
1. Executive summary
2. System components & responsibilities
3. End-to-end workflows (detailed)
  - Create Cluster
  - Create Droplet (provision)
  - Create Job (diagnose/monitor/scale/provision)
  - Autoscaler evaluate
  - Deployment (rollouts)
4. Data models & DB schema mapping
5. Events and Kafka contract
6. Logging pipeline & formats
7. Monitoring & metrics (Prometheus / Grafana)
8. Rate limiter & worker pool internals
9. Security considerations
10. Local dev & verification commands (how to run/validate flows)
11. Troubleshooting & common failure modes
12. Helpful file pointers & next improvements

---

1) Executive summary
---------------------
ClusterGenie is a full-stack demo app (React frontend + Go backend) for managing small demo cloud clusters, provisioning droplets, processing background jobs, and monitoring/observability. The backend (core-api) is a single Go service with modular domain services (provisioning, jobs, monitoring, autoscaler, scheduler) which persist to MySQL, use Redis for limiter/state, and Kafka for durable events. Logs converge into Kafka and a dedicated log-consumer forwards logs to Loki for Grafana correlation.

2) System components & responsibilities
----------------------------------------
- Frontend (frontend/): React + Vite. Calls REST endpoints under /api/v1 (configured by VITE_API_URL). Uses axios for API calls via repository pattern (e.g., clusterRepository.ts, dropletRepository.ts, jobRepository.ts).
- Backend — core-api (backend/core-api/): Gin-based HTTP server. Key sub-systems:
  - Services (backend/core-api/services/): ProvisioningService, JobService, ClusterService, DiagnosisService, AutoscalerService, MonitoringService, DeploymentService, BillingService.
  - Repositories (backend/core-api/repositories/): DB access via GORM (MySQL) and Redis client for caching / persisted limiter configs.
  - Kafka integration (backend/core-api/kafka): Producer + Consumer used to emit and consume structured events on topics such as cluster-events and logs.*.
  - WorkerPool (services/workerpool.go): background job queue & workers for async processing.
  - LimiterManager (services/limiter.go): token-bucket rate-limiter with in-memory and Redis-backed implementations.
- Log consumer (backend/log-consumer): Kafka consumer that reads logs.* topic, extracts labels (service, env, job_id, trace_id) and pushes to Loki.
- Monitoring stack (monitoring/): Prometheus scrapes /metrics from core-api; Grafana pre-provisioned dashboards show job & worker metrics; Loki stores structured logs.
- Orchestration: docker-compose.yml orchestrates MySQL, Redis, Kafka/Zookeeper, Prometheus, Grafana, Loki, core-api, log-consumer for local dev.

3) End-to-end workflows (detailed)
----------------------------------
This section documents the sequence and the exact payloads and file locations to inspect.

3.a) Create Cluster (UI -> backend -> DB)
- UI action: "Create cluster" in frontend triggers ClusterService.createCluster -> clusterRepositoryImpl -> POST ${API_BASE}/clusters
- Backend handler: `CreateClusterHandler` (backend/core-api/handlers.go)
  - Request model: `models.CreateClusterRequest` (name, region)
  - Implementation: `ClusterService.CreateCluster` (backend/core-api/services/clusterService.go)
  - DB: clusters table (database/migrations/000001_init.up.sql) — id (string), name, region, droplets JSON, status, last_checked
- Example request
  {
    "name": "production-api",
    "region": "nyc3"
  }
- Example response (201)
  {
    "cluster": { "id": "cluster-123", "name":"production-api", "region":"nyc3", ... },
    "message": "created"
  }

3.b) Create Droplet / Provision (UI or via job)
- UI: Provisioning panel calls POST /droplets with `CreateDropletRequest` (name, cluster_id optional, region, size, image, provider optional) — frontend/repositories/dropletRepository.ts
- Backend handler: `CreateDropletHandler` (handlers.go) -> `ProvisioningService.CreateDroplet` (services/provisioningService.go)
  - Validates cluster exists if cluster_id provided
  - Persists droplet via `dropletRepo.CreateDroplet` and adds droplet to the cluster via `clusterSvc.AddDropletToCluster`
  - Emits an event to Kafka with type `droplet_created` (producer calls PublishEvent("cluster-events", droplet.ID, event))
- DB: droplets table
- Example request
  {
    "name": "web-01",
    "cluster_id": "cluster-1",
    "region": "nyc3",
    "size": "s-1vcpu-1gb",
    "image": "ubuntu-20-04-x64"
  }

3.c) Create Job (diagnose / provision / scale / monitor) - full lifecycle
- UI calls: Job creation button calls JobService.createJob -> jobRepository.post to /jobs
- Backend handler: `CreateJobHandler` in handlers.go calls `JobService.CreateJob` (services/jobService.go)
  - CreateJob validates job type (provision/diagnose/scale/monitor)
  - JobRepository.CreateJob persists a record in jobs table with id, type, status=pending, traceID, parameters JSON
- Worker queue: main.go configures WorkerPool and sets jobSvc.SetWorkerPool(workerPool) (a channel-based goroutine pool). When a job is created, JobService submits job ID to workerPool.Submit.
- JobService.ProcessJob picks the job and processes based on type:
  - diagnose: simulated progress (job_started, job_progress, job_completed events published to cluster-events). Progress updates call jobRepo.UpdateJobProgress.
  - provision & scale: JobService.processProvisionJob/processScaleJob produce `job_requested` event to cluster-events — orchestration will do the heavy lifting (EventHandler + ProvisioningService).
  - monitor: similar to diagnose, a quick simulated job with job_started/job_completed events.

- Event orchestration: Kafka `cluster-events` topic receives events from JobService. `eventHandler` (services/eventHandler.go) subscribes via Kafka consumer and handles events:
  - On job_requested: EventHandler will mark job running and call `ProvisioningService.CreateDroplet` to create droplet, and push job_progress events (30, 75, 100) and finally job_completed.
  - Event payloads carry `job_id`, `job_type`, `cluster_id`, `progress`, `trace_id`, `message` and arbitrary `payload` map.

- Example job creation request
  POST /api/v1/jobs
  {
    "type": "diagnose",
    "parameters": { "cluster_id": "cluster-1" }
  }

- Example lifecycle summary (events):
  1) POST /jobs -> DB job(created, pending)
  2) JobService submits to worker pool, ProcessJob -> job_started (producer), progress events -> job_completed -> DB status updated
  3) For provision/scale: ProcessJob produces job_requested -> Kafka -> consumer-> EventHandler -> ProvisioningService -> creates droplet -> emits droplet_created -> JobRepository updates job progress/status accordingly

3.d) Autoscaler evaluate
- API endpoint: POST /api/v1/autoscaling/evaluate?cluster_id=<id>
- Handler: EvaluateAutoscalingHandler -> AutoscalerService.EvaluatePolicies
- Event-triggered auto-scaling is supported in EventHandler.handleMetricThresholdExceeded which calls ProvisioningService.ScaleCluster

3.e) Deployment (rollout simulation)
- Start simulated deployment: POST /api/v1/deployments/start handled by `DeploymentService` (services/deploymentService.go) — creates deployment state and uses Kafka events to simulate progress/rollouts.

4) Data models & DB mapping
---------------------------
Used DB tables (database/migrations/000001_init.up.sql)
- clusters: { id, name, region, droplets JSON, status, last_checked }
- droplets: { id, cluster_id, name, region, provider, size, image, status, created_at, ip_address }
- jobs: { id, cluster_id, type, status, trace_id, progress, created_at, completed_at, result, error, parameters }
- metrics: { id, cluster_id, type, timestamp, value, unit }

Mapping of models to Go structs is in backend/core-api/models/*.go. Frontend uses TypeScript interfaces in frontend/src/models/*.ts that mirror backend model shapes with small differences (snake_case vs camelCase conversion in repositories mapping functions).

5) Events & Kafka contract
---------------------------
Events are structured JSON carried on Kafka topics. The canonical types and fields are defined in backend/core-api/events/events.go — primary fields:
- type (string)
- job_id, job_type, cluster_id
- progress (int)
- message (string)
- timestamp (RFC3339)
- trace_id (string) — used for correlation
- payload (map[string]interface{}) — free-form for domain-specific data (e.g., metric arrays, droplet objects)

Common topics:
- cluster-events — used by core-api producers + consumers for job lifecycle, droplet_created, job_progress, job_completed, metric alerts
- logs.dev / logs.* — used by Vector (monitoring/vector) to publish container logs to Kafka and consumed by log-consumer

Event examples
- job_requested (produced by JobService for provision/scale)
  {
    "type": "job_requested",
    "job_id": "job-provision-20251129120000",
    "job_type": "provision",
    "cluster_id": "cluster-1",
    "payload": {"cluster_id": "cluster-1", ...},
    "trace_id": "uuid..."
  }
- job_progress & job_completed carry progress int, message

6) Logging pipeline & formats
-----------------------------
- App logs should be JSON with top-level keys forming common labels:
  { "service": "core-api", "environment": "dev", "level": "info", "timestamp": "...", "message": "...", "job_id": "...", "trace_id": "..." }

- Vector (monitoring/vector/vector.toml) config reads docker logs and publishes to Kafka topic `logs.dev`.
- Log-consumer subscribes to logs.dev and pushes to Loki using the JSON payload as the line. It extracts labels: service, environment, level, and optionally job_id and trace_id and sends them as labels to Loki, enabling efficient filtering in Grafana.
- Log-consumer code: backend/log-consumer/main.go
  - Extract top-level fields or nested JSON within message/log; builds Loki `streams` body:
    { "streams": [ { "labels": "{service=\"core-api\",env=\"dev\",level=\"info\",job_id=\"...\"}", "entries": [{"ts":"...","line":"{...}"}] } ] }

7) Monitoring & metrics (Prometheus / Grafana)
----------------------------------------------
Key metrics (services/metrics.go):
- clustergenie_http_request_duration_seconds{method,path,status} (histogram)
- clustergenie_http_requests_total{method,path,status} (counter)
- clustergenie_job_processing_seconds (histogram by job_type, status)
- clustergenie_jobs_processed_total{status}
- clustergenie_workerpool_queue_length
- clustergenie_workerpool_active_workers
- clustergenie_workerpool_worker_count
- clustergenie_rate_limit_exceeded_total{endpoint,scope_type,scope_id}
- clustergenie_rate_limit_available_tokens{endpoint,scope_type,scope_id}
- clustergenie_cluster_metric_value{cluster_id,metric_type,unit} (DB-sourced exporter)

Rules and alerts (monitoring/prometheus/rules/prometheus_rules.yml) include:
- p95 job_processing > 5s -> alert
- worker queue length > 50 → HighWorkerPoolQueueLength
- rate limit exceeded spikes
- job failures rate by type/cluster

Dashboards in monitoring/grafana/dashboards/ include job workflow dashboard which combines metrics and logs and uses job_id / trace_id to correlate logs and metrics.

8) Rate limiter & WorkerPool internals
--------------------------------------
- LimiterManager (services/limiter.go) supports TokenBucket (in-memory) and RedisTokenBucket (distributed using an atomic Lua script stored in limiter.go). Buckets can be named and optionally scoped per-user / per-cluster.
- Middleware layer (backend/core-api/middleware/ratelimit.go) provides three middlewares:
  - RateLimitMiddleware(manager, name) — global scope
  - RateLimitMiddlewareByUserHeader(manager, name, headerName) — uses X-User-ID header (or custom header) to scope per-user
  - RateLimitMiddlewareByClusterFromBody(manager, name, field) — looks into JSON body to extract cluster_id and scope per cluster
- Persisted limiter configs live in Redis under keys `limiter_config:<name>:<scope>`

- WorkerPool (services/workerpool.go): ring-buffer channel queue and N worker goroutines; Submit returns false if queue full. JobService submits job IDs and worker goroutines call ProcessJob(jobID).
- WorkerPool metrics are published into Prometheus gauges by main.go via periodic snapshots.

9) Security & operational considerations
----------------------------------------
- There is no production-grade authentication or authorization; X-User-ID header is used only for scoping for rate limiter experimentation. In production, add OAuth/OpenID Connect or API keys and RBAC.
- Database migrations exist in database/migrations; ensure production migrations are applied in order; do not use `gorm.AutoMigrate` absent explicit review.
- Event content and type names must be considered stable if other services depend on them; change carefully with versioned topic or event schema changes.
- Logs may include sensitive information; ensure secrets are redacted before shipping logs to Loki.

10) Local dev & verification commands (how to run/validate flows)
-----------------------------------------------------------------
Quick start (assumes Docker Desktop, Node, Go, and typical dev tooling available):
1. Start the full environment (docker-compose + frontend + backend) with the provided script:

```bash
./start.sh
```

This opens terminals and starts Docker services and local dev servers.

2. Manually:
- Start docker-compose services (db, redis, kafka, prometheus, grafana, loki, vector, log-consumer)

```bash
docker-compose up -d mysql redis zookeeper kafka prometheus grafana loki vector log-consumer
```

- Start backend (hot reload) in a separate terminal

```bash
cd backend/core-api
air # or go run ./...
```

- Start frontend

```bash
cd frontend
yarn install
yarn dev
```

3. Quick functional checks:
- Health endpoint: curl http://localhost:8080/api/v1/health/<clusterId>
- Create cluster: POST /api/v1/clusters
- Create job: POST /api/v1/jobs (simulate workload)
- Check Prometheus at http://localhost:9090 and Grafana at http://localhost:3001
- View logs in Grafana/Loki Explore UI; logs will be labeled with service, env, and — when available — job_id and trace_id

4. Generate demo traffic
- Use monitoring/demo/loadgen to push diagnostic and job traffic which populates Prometheus and shows workflow traces in Grafana.

Example curl - create job
```bash
curl -X POST http://localhost:8080/api/v1/jobs -H "Content-Type: application/json" -d '{"type":"diagnose","parameters":{"cluster_id":"cluster-1"}}'
```

11) Troubleshooting & common failure modes
-----------------------------------------
- Kafka consumer/producer fails to connect: ensure Zookeeper and Kafka started and docker network names match `KAFKA_BROKERS`. Check `docker-compose logs kafka`.
- Prometheus scrape failing: ensure core-api /metrics reachable; if core-api runs on host use host.docker.internal in prometheus.yml or add `extra_hosts` in docker-compose.
- Rate limit rejects: reduce traffic or increase CLUSTERGENIE_JOBS_RATE/CLUSTERGENIE_JOBS_CAP env vars, or POST a limiter config via /observability/ratelimit/config.
- WorkerQueue full: Increase CLUSTERGENIE_WORKER_COUNT or CLUSTERGENIE_WORKER_QUEUE; inspect /observability/workerpool and Prometheus worker pool metrics.
- Log-consumer failing to push to Loki: check LOKI_URL and logs from log-consumer container using `docker-compose logs -f log-consumer`.
- DB migration issues: check database/migrations and run migration commands (see README/TESTING.md). If schema mismatch, inspect gorm migrations and seed sql.

12) Helpful file pointers (where to look for details)
-----------------------------------------------------
- Backend REST handlers: backend/core-api/handlers.go
- Services & Domain logic: backend/core-api/services/*.go (jobService.go, provisioningService.go, eventHandler.go, limiter.go, workerpool.go, metrics.go)
- Repositories: backend/core-api/repositories/*.go
- Event structure + broker: backend/core-api/events/events.go
- Log consumer: backend/log-consumer/main.go
- Monitoring config: monitoring/prometheus/*, monitoring/grafana/*, monitoring/loki/*, monitoring/vector/*
- Frontend service & repo layer: frontend/src/services/* & frontend/src/repositories/*
- Frontend models: frontend/src/models/*
- DB migrations: database/migrations/000001_init.up.sql
- Docker compose & start scripts: docker-compose.yml, start.sh, stop.sh
- E2E: e2e/playwright/* (tests and helpers)

---

Appendix: Quick API reference (most used endpoints)
- POST /api/v1/clusters — create cluster
- GET /api/v1/clusters — list clusters
- GET /api/v1/clusters/:id — get cluster
- POST /api/v1/droplets — create droplet
- GET /api/v1/droplets/:id — get droplet
- POST /api/v1/jobs — create job (payload: {type, parameters})
- GET /api/v1/jobs/:id and /api/v1/jobs (list)
- POST /api/v1/diagnosis/diagnose — diagnose cluster ({cluster_id})
- /metrics — Prometheus (scrape endpoint)
- /observability/* — limiter & workerpool debug endpoints

---

If you want I’ll:
- Generate step-by-step demo scripts (curl or small CLI) that run the full happy path (create cluster → create job → observe job lifecycle in Grafana + logs).
- Add visual sequence diagrams (PNG/SVG) for the flows above and commit them into docs/architecture.

If you'd like more depth on one flow (e.g. job orchestration with exact DB updates & event payloads), tell me which flow to expand and I'll add a trace-ready example including an annotated log stream and the Prometheus graph to confirm behavior.

---

Detailed trace example (end-to-end)
-----------------------------------
This example demonstrates the `diagnose` job flow and the artifacts produced at each step. It assumes the API is reachable at http://localhost:8080/api/v1 and Kafka/Log pipelines are active.

1) UI / Client: create job request (X-User-ID header optional, used for rate-limiting scope)

POST /api/v1/jobs
Headers: Content-Type: application/json; X-User-ID: user:alice
Body:
{
  "type": "diagnose",
  "parameters": { "cluster_id": "cluster-1" }
}

2) core-api CreateJob -> DB
- Job row inserted (jobs table):
  id: job-diagnose-20251129..., type: "diagnose", status: "pending", trace_id: <uuid>, parameters: JSON string

3) Worker picks job (WorkerPool) -> JobService.ProcessJob
- Job status updated: running
- JobService publishes job_started event to Kafka (cluster-events) and emits intermediate job_progress events

4) Kafka consumer (core-api consumer / EventHandler) receives events
- If orchestration necessary the consumer may create droplets / scale
- EventHandler stores metrics if present and updates job progress via jobRepository.UpdateJobProgress

5) JobService / worker finishes
- DB job status updated to completed (progress=100)
- JobService increments JobsProcessed counter (Prometheus)

6) Logs + Traces (example lines showing trace_id/job_id correlation)
- core-api log (JSON):
  {"service":"core-api","environment":"dev","level":"info","message":"job Created","job_id":"job-diagnose-...","trace_id":"<trace-uuid>","timestamp":"..."}
- job progress events -> kafka -> event consumer -> log-consumer -> Loki label set: {service="core-api", env="dev", job_id="job-diagnose-...", trace_id="<trace-uuid>"}

7) Observability correlation
- Prometheus metrics: clustergenie_job_processing_seconds{job_type="diagnose",status="completed"}
- Grafana: use Job ID or Trace ID to search logs and filter metrics panels for that job instance

This trace demonstrates how the job_id and trace_id fields allow tracing across persistence (DB rows), event stream (Kafka), logs (Loki), and metrics (Prometheus) to give a single-line-of-sight through the system.
