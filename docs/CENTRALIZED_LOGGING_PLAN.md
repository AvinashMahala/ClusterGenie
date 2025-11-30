## Centralized Logging Service — Plan for ClusterGenie

Last updated: 2025-11-29

Purpose: document the design, standards, storage choices, Grafana integration, and a phased implementation plan for a centralized logging service for ClusterGenie.

This plan assumes the project already has Kafka configured and that the `backend/core-api` should not take on log handling responsibilities beyond emitting structured log messages to stdout.

---

## Summary / Goals ✅

- Keep the backend/core-api lightweight: app should emit structured log entries (JSON) but not manage delivery to aggregators.
- Use Kafka as the transport layer for log events: apps and sidecar agents publish to a `logs` topic.
- Build a central Logging Consumer service to read from Kafka, enrich/normalize logs, apply policies (redaction/sampling), and forward to one or more sinks (Loki/Elasticsearch/Splunk/Datadog/S3).
- Make logs compatible with Grafana (via Loki) and other aggregators.
- Provide observability for the logging pipeline (lag, errors, throughput) and health endpoints.

---

## Architecture Overview (Recommended) 🏗️

1. Application emits structured logs to stdout in a standardized JSON shape (minimal wrapper in `backend/core-api`).
2. Sidecar/agent (Vector / Fluent Bit) running next to the app collects container stdout and publishes the messages to Kafka (topic: `logs.{env}` or `logs`). This keeps the app out of Kafka concerns.
3. Central Logging Consumer service (a horizontally scalable Go service) consumes `logs` topic, validates and normalizes messages, performs PII redaction/policies, and routes to configured sinks. Examples:
   - Grafana Loki (for log exploration in Grafana)
   - Elasticsearch / OpenSearch (for indexing and search)
   - Splunk / Datadog (when enterprise needs exist)
   - S3 archival for long-term retention
4. Grafana queries Loki (or ES via Grafana datasource) to display logs and to correlate logs with traces in Tempo/Jaeger if available.

Diagram (simplified):

    core-api (stdout JSON) --> sidecar/agent (Vector/Fluent Bit) --> Kafka:logs topic --> log-consumer --> Loki / ES / Splunk / archive

---

## Log Schema / Standard (required) 📜

All logs MUST be emitted as JSON objects (newline-delimited). Use consistent naming and types. Below is the recommended baseline schema.

Required fields:
- timestamp: ISO8601 RFC3339 (string) — precise time of event
- level: string — one of DEBUG, INFO, WARN, ERROR, FATAL
- service: string — service name, e.g. "core-api"
- environment: string — dev/staging/prod
- message: string — human-readable message

Recommended fields (optional but strongly encouraged):
- event_type: string — short type, e.g., request, audit, job, metric
- trace_id: string (optional) — correlation for distributed tracing
- request_id: string (optional) — HTTP request ID
- host/container/pod info: host, container_id, pod
- version: service version / git-sha
- attributes: object — free-form typed map for structured metadata
- error: object — { type, message, stack } for rich errors

Example: 

```
{
  "timestamp": "2025-11-29T15:43:12.123Z",
  "level": "INFO",
  "service": "core-api",
  "environment": "dev",
  "message": "Job processed successfully",
  "event_type": "job",
  "trace_id": "00-abcdef-12345-01",
  "request_id": "req-1234",
  "version": "v1.3.4",
  "attributes": { "job_id": "j-987", "user_id": "u-22", "duration_ms": 256 }
}
```

Schema tips:
- Prefer typed values in attributes (numbers for durations, booleans, etc.).
- Keep the top-level fields low-cardinality; put variable fields under `attributes`.
- Add a `version` or `log_schema_version` to allow schema evolution.

---

## Where to store logs & how Grafana consumes them? 🗄️➡️📊

Storage sinks considered:

- Grafana Loki (Recommended when Grafana is the consumer):
  - Loki stores logs as streams with labels and is optimized for Grafana queries.
  - Log entries can be pushed via Loki HTTP API (ingester) or written to Loki-compatible endpoints.
  - Use label fields to index frequently queried metadata (service, environment, level) — keep cardinality low.
  - Logs can be queried in Grafana logs panel and correlated with metrics/traces

- Elasticsearch / OpenSearch:
  - Full-text search & powerful indexing capabilities, good for analytics and complex queries.
  - Higher cost and index maintenance considerations (shards, retention policies).

- Splunk / Datadog:
  - Commercial offerings with advanced search, retention, and alerting.
  - Can be added alongside Loki/ES as a sink if required for compliance.

- Cold storage (S3/archives):
  - Use for long-term retention; rely on Kafka consumer to batch and write archived files.

How Grafana consumes logs:

- Directly from Loki: Grafana's Loki datasource will query the Loki store using label selectors (e.g., {job="core-api", env="prod"}).
- From Elasticsearch: Grafana’s Elasticsearch datasource can query logs stored in ES indexes.
- For correlation: Grafana can link logs to traces if you run a tracing backend like Tempo/Jaeger and ensure `trace_id` exists on log messages.

Recommended initial storage: Loki for logs (Grafana-native, efficient) + S3 for archive.

---

## Security and Governance 🔐

- Secure Kafka and sink connections (TLS + SASL or mTLS).
- Implement redaction (sensitive fields) and policy-based dropping in the central consumer.
- Access control for Grafana dashboards and log indices.

---

## Phased implementation plan — PR sized phases (detailed)

Phase 0 — Preparation & design (PR-size: design doc review)
- Finalize schema and naming conventions (this doc).
- Decide sidecar agent (Vector vs Fluent Bit). Recommendation: Vector (good filtering, routing, and observability) or Fluent Bit as a lightweight alternative.
- Decide topic names & retention policy: `logs.{env}` or `logs`.

Acceptance criteria:
- This doc reviewed and approved by team.

Phase 1 — POC (PR-size: small service + compose changes)
- Add Vector/Fluent-bit in `docker-compose.yml` as a dev-sidecar/service that collects `core-api` container logs and publishes to Kafka `logs.dev`.
- Create a simple Log Consumer prototype that consumes `logs.dev` and writes to a local file or sends JSON to a local Loki instance (dev only).
- Produce a few representative structured log lines from `core-api` and verify end-to-end delivery to the POC sink.

Acceptance criteria:
- Sidecar successfully forwards logs to Kafka.
- Log consumer reads Kafka and writes logs to local file and/or Loki.

Phase 2 — Structured logging in `core-api` (PR-size: small wrapper & migrations)
- Introduce a tiny logging wrapper in `backend/core-api` (single package) that emits JSON logs to stdout and supports trace IDs & request IDs. Keep synchronous writes fast/non-blocking.
- Replace some critical calls to demonstrate format parity.
- Add unit tests for the logging package.

Acceptance criteria:
- core-api logs are valid JSON and include the required fields.

Phase 3 — Centralized Log Consumer (PR-size: consumer service)
- Implement a scalable Go service `log-consumer` that consumes `logs` topic(s), validates, enriches, and forwards to sinks.
- Add support for Loki HTTP API and S3 archival (config driven).
- Add filtering pipelines: parsing errors, redaction rules, sampling.
- Expose health and Prometheus metrics (consumer lag, errors, throughput).

Acceptance criteria:
- `log-consumer` deployed locally and verified to deliver logs to Loki.
- Metrics available in Prometheus format.

Phase 4 — Hardening + deployment (PR-size: infra & configs)
- Add production-grade config: TLS/SASL for Kafka, multiple partitioning, consumer group management.
- Add pipeline rules: alerting rules for log errors and consumer lag.
- Add CI checks for log schema compatibility.

Acceptance criteria:
- Production config validated; logs flow to Loki in pre-prod and prod (end-to-end test).

Phase 5 — Extensions & integrations (PR-size: per sink)
- Add optional sinks: Elastic, Splunk, Datadog integrations.
- Add advanced features: sampling, log-based alerts, per-tenant suppression.

---

## Local dev & test checklist

- Run Kafka, Loki, and Vector in `docker-compose` for dev.
- Produce sample logs from core-api and assert messages appear in Loki and the `logs` Kafka topic.
- Run unit tests for `log-consumer` and the core-api logging wrapper.

Commands (dev):

```bash
# start kafka & loki & core-api (dev compose that we will add in Phase 1)
docker-compose up -d kafka loki core-api vector

# tail logs for Vector / Kafka / Loki
docker-compose logs -f vector
docker-compose logs -f kafka
docker-compose logs -f log-consumer
```

---

## Acceptance criteria & KPIs

- End-to-end latency: 95th percentile under 5s (dev) / under 10s (prod target) for log delivery to primary sink.
- Consumer lag: near zero under normal load; alerts if lag > acceptable threshold (e.g., 10k messages).
- Schema compliance rate > 99.9% for service logs.

---

## Next work items (short-term tasks) 🧭

1. Add Vector/Fluent-Bit to `docker-compose` (dev) + quick script to seed logs into Kafka for the POC.
2. Create `log-consumer` prototype (Go) that writes to a local Loki for dev.
3. Add minimal logging wrapper to `backend/core-api` and replace representative log.Printf calls.

---

If this plan looks good to you I will:

- Add the `Vector`/`log-consumer` POC to the repo and update `docker-compose.yml` for a dev environment. 
- Break the work into individual PR-sized todos and track progress.

---

End of document.
