# Actions Planned — ClusterGenie

Purpose
-------
This file is the canonical, session-driven plan and workboard for the ClusterGenie repo. Each session or change will begin by referencing this document; progress will be recorded here so we can continue work phase-by-phase from design → implementation → validation → done.

How we'll use this file
-----------------------
- The assistant (and contributors) will update this file at the start and the end of each session.
- Each phase has a brief description, acceptance criteria and clear owner/ETA slots.
- When a phase is in progress the assistant will update the phase status and write short notes about changes made and tests performed.

High-level phases
------------------
1) Repo analysis & blockers (completed)
   - Status: completed
   - Outcome: Documented DB migrate error, Docker/local host mismatches, frontend compile issues and missing workflow mismatches.
   - Next: Move to core infra fixes (phase 2)

2) Core infra / configuration fixes (priority)
   - Status: completed
   - Goal: Make all service endpoints configurable via environment variables, update Docker Compose to pass configuration, and eliminate hard-coded "localhost" addresses in the backend and frontend.
   - Acceptance criteria:
     - `backend/core-api` reads DB/Redis/Kafka config from env vars.
     - `docker-compose.yml` provides matching env values for service discovery (e.g., `MYSQL_HOST=mysql`, `REDIS_HOST=redis`, `KAFKA_BROKERS=kafka:9092`).
     - Frontend uses `VITE_API_URL` and `VITE_GRAFANA_URL` (no hard-coded URLs in source).

3) Database schema / migrations (priority)
   - Status: not-started
   - Goal: Resolve migration conflicts (e.g. TEXT indexes) and add a versioned migration pipeline (migrate/goose/etc.)
   - Acceptance criteria:
     - Migration errors in `backend-dev.log` no longer occur.
     - A reproducible migration plan + SQL migrations exist under `database/migrations/` and can be run in CI.

4) Frontend fixes & stability
   - Status: not-started
   - Goal: Fix compile-time SASS and JSX issues, configure env-driven endpoints, correct Grafana embed port and other runtime bugs.
   - Acceptance criteria:
     - Local `yarn dev` runs with zero compile errors.
     - App communicates with backend using `VITE_API_URL`.
     - Grafana embeds work when Grafana runs on port `3001`.

5) Graceful shutdown, resiliency and worker cleanup
   - Status: not-started
   - Goal: Add signal handling and graceful shutdown to `core-api` (stop worker pool, disconnect Kafka consumer, close DB/Redis connections, shutdown HTTP server cleanly).
   - Acceptance criteria:
     - `core-api` shuts down within 30s on SIGTERM.
     - No leaked goroutines or open DB handles in logs.

6) CI / Test automation (medium)
   - Status: not-started
   - Goal: Add GitHub Actions that run unit tests for backend & frontend, plus an integration job that spins up docker-compose and runs tests that require infra.
   - Acceptance criteria:
     - Pull requests run unit tests and fail on regressions.
     - Integration tests can be run in CI and are deterministic.

7) Microservices split (architectural decision)
   - Status: not-started
   - Goal: Decide whether to keep `core-api` monolith or split into separate services (diagnosis/provisioning/monitoring). If splitting, create separate Docker services and adjust start scripts & docs.
   - Acceptance criteria:
     - Documentation updated and either a split architecture implemented or monolith documented as intentional design.

8) Observability & dashboards (nice to have)
   - Status: not-started
   - Goal: Verify Prometheus metrics and Grafana dashboards are functional and that frontend embeds show relevant data.
   - Acceptance criteria:
     - Grafana dashboards show rate limit and worker metrics for demo clusters.

9) Security & secrets guidance
   - Status: not-started
   - Goal: Add docs for local secret handling, do NOT commit secrets, and add small tooling/README for dev env variables.

Session update convention
-------------------------
- Each session the assistant will add a short note under "Session log" with the date, the work items completed and the next plan.

Session log (recent)
--------------------
- 2025-11-29 — Created this file as the canonical plan. Phase 1 (analysis) already completed. Next: Phase 2 — Make infra config env-driven and update docker-compose.
- 2025-11-29 — Implemented Phase 2: backend/core-api now reads DB/Redis/Kafka config from env vars; updated `docker-compose.yml` to pass env values (`MYSQL_HOST=mysql`, `REDIS_ADDR=redis:6379`, `KAFKA_BROKERS=kafka:29092`); frontend uses `VITE_API_URL` and `VITE_GRAFANA_URL`; tests updated to respect `REDIS_ADDR`; updated README/TESTING.md to document changes. Next: Phase 3 — Database schema & migration pipeline.
 - 2025-11-29 — Started Phase 3: Added a versioned migration pipeline under `database/migrations/` (initial migration + rollback), added Makefile targets (`migrate-up`, `migrate-down`, `migrate-force`), updated `setup.sh` to prefer migrations and added database README. Also set explicit `varchar(255)` types for `cluster_id` in models to avoid TEXT index errors. Next: verify CI and tests run with migrations in place.

---

Notes & contact
---------------
This file is maintained by the assistant for human + AI collaboration. When you want me to implement the next step (phase-by-phase), say which phase I should begin with and I will update this file before making code changes.
