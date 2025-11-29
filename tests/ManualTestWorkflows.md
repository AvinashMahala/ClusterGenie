# ClusterGenie — Manual Test Workflows (Regression & Feature Testing)

This document contains step-by-step manual test workflows QA can follow to thoroughly exercise ClusterGenie (backend, frontend, monitoring & integrations). Each workflow includes: Purpose, Preconditions, Test Steps, Expected Outcome and Image placeholders for screenshots that can be attached later.

For each test case include a short unique id (e.g. TC-CL-001), the build / environment used, and the tester name/date when running.

---

## Table of contents

- Setup & Preconditions
- Smoke / Health checks
- API tests (core-api)
- Frontend app tests (UI flows)
- Provisioning & Droplet lifecycle
- Jobs & Worker processing
- Metrics, Prometheus & Grafana verification
- Rate-limiter / Throttling tests
- Kafka / Events tests
- Regression checklist and data cleanup

---

## How to use these tests

- Follow the preconditions for each test.
- Execute each step in the numbered order and record results (pass/fail).
- Attach screenshots using the placeholder path listed in each test step.
- Record any defects with reproduction steps, logs and environment values.

Local scripted tests: this repo also includes a small set of sample curl-based scripts you can run for Phase 8 flows (autoscaling, deployments, providers, billing):

	- Location: `tests/sample-tests`
	- Use `chmod +x tests/sample-tests/*.sh` and `tests/sample-tests/run-all.sh` to execute them locally against a running core-api.
	- If you'd prefer Postman/Newman, `tests/postman` contains a ready-to-import collection and environment.

---

## Setup & Preconditions ✅

Before running tests, ensure the following environment is prepared and stable:

- Backend services (core-api, provisioning, monitoring) are running. (See `docker-compose.yml` or project's README for instructions.)
- Database seeded with test-data (refer to `database/init.sql` and `database/seed.sql`). Use a separate test schema if possible.
- Kafka broker (for event tests) is reachable at KAFKA_BROKERS (see `.env.example`).
- Prometheus & Grafana are available for metrics tests.
- Frontend is built and served locally (or available in a QA environment).

Record the environment variables used and the commit/branch of the code for traceability.

---

## Smoke / Basic Health Checks (TC-SMOKE-*)

TC-SMOKE-001 — Health endpoint / API discovery

- Purpose: Ensure core backend is responding and docs (Swagger) are available.
- Preconditions: core-api is running.
- Steps:
	1. Request GET /health or GET / (root) endpoint.
	2. Open Swagger UI or Swagger JSON at `/docs` (or `/swagger.json` as available).
	3. Confirm main endpoints appear in swagger.
	4. Capture screenshot.
- Expected outcome: 200 OK from health endpoint, Swagger JSON loads and lists cluster/job/metric endpoints.
- Image placeholder: docs/images/smoke-health-01.png

TC-SMOKE-002 — Frontend load

- Purpose: Basic verification frontend is serving.
- Preconditions: frontend is running or accessible.
- Steps:
	1. Open the app in browser at configured URL.
	2. Verify main homepage renders without console errors.
	3. Navigate to the cluster list / dashboard pages.
- Expected outcome: Main screens load and visible, no fatal JS console errors.
- Image placeholder: docs/images/smoke-frontend-01.png

---

## API Tests — Clusters & Repositories (TC-API-CL-*)

TC-API-CL-001 — List clusters (GET /clusters)

- Purpose: Verify cluster listing returns expected schema and items.
- Preconditions: At least one cluster exists in DB.
- Steps:
	1. Request GET /clusters or backend equivalent.
	2. Validate HTTP status is 200.
	3. Validate response JSON includes array, with fields: id, name, status, created_at.
	4. Verify pagination parameters if supported (page, pageSize).
- Expected outcome: 200 OK with a well-formed cluster list.
- Image placeholder: docs/images/api-clusters-list-01.png

TC-API-CL-002 — Get cluster detail (GET /clusters/{id})

- Purpose: Verify retrieving a single cluster returns descriptive info.
- Preconditions: A valid cluster id exists.
- Steps:
	1. Request GET /clusters/{id} using an existing id.
	2. Validate HTTP 200 and cluster fields match the DB record.
	3. Try an invalid id -> expect 404 and an error payload.
- Expected outcome: Valid id returns 200 with details; invalid id returns 404.
- Image placeholder: docs/images/api-clusters-get-01.png

TC-API-CL-003 — Delete cluster (DELETE /clusters/{id})

- Purpose: Verify delete semantics and side-effects (droplet cleanup, jobs handling).
- Preconditions: A cluster exists with related droplets/jobs.
- Steps:
	1. Request DELETE /clusters/{id}.
	2. Confirm response 200 or 204.
	3. Validate cluster is removed from GET /clusters and database.
	4. Verify related droplets or jobs behave as expected (deleted or flagged).
- Expected outcome: Cluster removed, no orphan records created. If business rules require soft-delete, verify accordingly.
- Image placeholder: docs/images/api-clusters-delete-01.png

---

## API Tests — Droplet / Provisioning (TC-API-DP-*)

TC-API-DP-001 — Create droplet / start provisioning (POST /droplets)

- Purpose: Verify provisioning API triggers droplet creation.
- Preconditions: Provisioning service reachable and DB ready.
- Steps:
	1. POST /droplets with a typical request body (flavour, region, clusterId, image).
	2. Validate response 201/202 with droplet id and initial status (e.g., provisioning).
	3. Verify an event or job is created to process the provisioning (if applicable).
- Expected outcome: API returns droplet id and status; provisioning background job queued.
- Image placeholder: docs/images/api-droplet-create-01.png

TC-API-DP-002 — Get droplet (GET /droplets/{id})

- Purpose: Verify status and metadata retrieval.
- Preconditions: A droplet exists or is being provisioned.
- Steps:
	1. GET /droplets/{id}.
	2. Validate response includes IP, status, created_at, clusterId.
	3. Simulate state transition (provisioned -> active) and re-check.
- Expected outcome: Droplet details return and reflect lifecycle status changes.
- Image placeholder: docs/images/api-droplet-get-01.png

TC-API-DP-003 — Delete droplet (DELETE /droplets/{id})

- Purpose: Ensure droplets can be safely removed.
- Preconditions: A droplet exists and is in deletable state.
- Steps:
	1. DELETE /droplets/{id}.
	2. Validate response and check droplet no longer in list or DB.
	3. Confirm any dependent resources were cleaned up.
- Expected outcome: Droplet removed or transitioned to deleting state; system maintains consistency.
- Image placeholder: docs/images/api-droplet-delete-01.png

---

## API Tests — Jobs & Worker processing (TC-API-JOB-*)

TC-API-JOB-001 — Create job (POST /jobs)

- Purpose: Verify job creation sets a job record and enqueues work.
- Preconditions: core-api is reachable; workerpool/queue running to process.
- Steps:
	1. POST /jobs with required payload (type, clusterId, params).
	2. Expect response contains job id, status (queued), and created_at.
	3. Verify job appears in GET /jobs and list APIs.
- Expected outcome: 201 created, job queued; GET returns expected job metadata.
- Image placeholder: docs/images/api-job-create-01.png

TC-API-JOB-002 — Job lifecycle & progress updates

- Purpose: Verify job progresses from queued -> running -> completed; progress updates are persisted.
- Preconditions: Workerpool or processor that executes jobs is available.
- Steps:
	1. Create a job that triggers measurable work (mocked or test command).
	2. Poll GET /jobs/{id} or GET /jobs to observe status changes.
	3. Inspect logs and DB to verify UpdateJobProgress and UpdateJobStatus events occurred.
- Expected outcome: Job moves through lifecycle and final status is `completed` or `failed` with meaningful error.
- Image placeholder: docs/images/api-job-lifecycle-01.png

TC-API-JOB-003 — Cancel job / error handling

- Purpose: Confirm jobs can be cancelled and proper cleanup occurs.
- Preconditions: A running or queued job exists.
- Steps:
	1. Send a cancel/update status request (if API supports) or trigger termination flow.
	2. Validate API response and final job state.
	3. Confirm workerpool stops processing the job and resources are freed.
- Expected outcome: Job moves to cancelled/failed appropriately and no partial or corrupted state persists.
- Image placeholder: docs/images/api-job-cancel-01.png

---

## Frontend UI Workflows (TC-UI-*)

Note: Where the UI calls APIs, include a negative test case (API failures) and positive case (success).

TC-UI-CL-001 — View Cluster List (UI)

- Purpose: Verify cluster list UI shows items and links to details.
- Preconditions: Some clusters exist.
- Steps:
	1. Open Clusters page in the frontend.
	2. Verify clusters list populates and pagination works.
	3. Click cluster to view details.
	4. Attach screenshot of list and details view.
- Expected outcome: List displays cluster entries with expected columns (name, status, created_at). Details view shows metadata.
- Image placeholder: docs/images/ui-clusters-list-01.png

TC-UI-DP-001 — Create Droplet (UI) and monitor provisioning

- Purpose: Verify UI flow to create and monitor a droplet.
- Preconditions: User is on the cluster detail page with enough permissions.
- Steps:
	1. Click 'Add Droplet' in UI and fill out the form (flavour, region, image).
	2. Submit and confirm acknowledgment/queued state.
	3. Observe the droplet appear in the UI with 'provisioning' state and update to 'active'.
	4. Capture screenshots of all states.
- Expected outcome: UI successfully creates droplet, shows provisioning updates, and final active state.
- Image placeholder: docs/images/ui-droplet-create-01.png

TC-UI-JOB-001 — Create Job (UI) and verify result

- Purpose: Verify that a job may be created from the UI and the status is shown.
- Preconditions: User has cluster selected and job creation is allowed.
- Steps:
	1. From the cluster view, create a new job using the job creation form.
	2. Validate the job appears in the jobs list with `queued` status.
	3. Observe lifecycle until `completed` or `failed`.
	4. Capture screenshots at each status transition.
- Expected outcome: UI displays jobs with correct statuses and metadata.
- Image placeholder: docs/images/ui-job-create-01.png

---

## Monitoring & Metrics (TC-MON-*)

TC-MON-001 — Prometheus metrics available

- Purpose: Verify backend instruments metrics correctly and metrics are exported.
- Preconditions: Prometheus scrape is configured for core-api and worker components.
- Steps:
	1. Query Prometheus for metric names used in app (e.g., clustergenie_job_processing_seconds_bucket, clustergenie_rate_limit_exceeded_total).
	2. Validate recent samples appear for test actions (e.g., after creating jobs or hitting a rate limit).
	3. Capture screenshots of queries and values.
- Expected outcome: Metrics exist and values reflect recent operations.
- Image placeholder: docs/images/monitor-prometheus-01.png

TC-MON-002 — Grafana dashboard panels

- Purpose: Validate Grafana dashboards show the expected signals.
- Preconditions: Grafana is configured and dashboard `cg-minimal` imported.
- Steps:
	1. Open Grafana UI and navigate to minimal dashboard.
	2. Verify panels: workerpool queue length, job processing p95/p99, rate-limit charts.
	3. Generate load (jobs, rate-limiter hits) and validate panels react.
- Expected outcome: Dashboard panels display metrics and reflect test activity.
- Image placeholder: docs/images/monitor-grafana-01.png

---

## Rate Limit / Throttling Tests (TC-RL-*)

TC-RL-001 — Scoped rate limit behaviour

- Purpose: Verify scoped rate limiter works and metrics increment when exceeded.
- Preconditions: Rate limiting middleware configured.
- Steps:
	1. From a client or script, issue requests at a rate that exceeds the configured per-scope limit.
	2. Verify responses show proper 429/limit headers or error payload.
	3. Query Prometheus for clustergenie_rate_limit_exceeded_total to verify increments.
- Expected outcome: Requests above threshold are rejected, metrics increment accordingly.
- Image placeholder: docs/images/ratelimit-01.png

---

## Kafka / Events Testing (TC-KAFKA-*)

TC-KAFKA-001 — Publish / consume events

- Purpose: Verify event production & consumption flows (e.g., droplet events, job events).
- Preconditions: Kafka broker available; consumer group listening.
- Steps:
	1. Trigger an action that publishes an event (create droplet, create job, state changes).
	2. Monitor the event topic to confirm the event published.
	3. Verify the consumer ingests the event and triggers appropriate actions.
	4. Inspect consumer logs or ack counters.
- Expected outcome: Events published to the topic and successfully consumed; corresponding side effects occur.
- Image placeholder: docs/images/kafka-events-01.png

---

## Workerpool / Background Processing (TC-WP-*)

TC-WP-001 — Worker concurrency / queue behaviour

- Purpose: Verify worker pool processes queued jobs and scales concurrency as expected.
- Preconditions: Workerpool configured; queue contains several jobs.
- Steps:
	1. Enqueue multiple jobs simultaneously.
	2. Observe processing concurrency, queue reductions, and completed jobs.
	3. Monitor worker logs for errors and job progress metrics in Prometheus.
- Expected outcome: Jobs processed within concurrency limits with predictable timings and no hidden deadlocks or leaks.
- Image placeholder: docs/images/workerpool-01.png

---

## Edge-cases & Negative Tests (TC-NEG-*)

- API input validations: Submit malformed payloads, missing required fields — expect 400 with helpful messages.
- API auth/permission errors: Requests without proper auth (if applicable) — expect 401/403.
- Service unavailability: Simulate downstream failure (e.g., DB offline, provisioning service down) and verify errors propagated gracefully.
- Long-running jobs and timeouts: Ensure timeouts and partial failures handled and recorded.

Example: TC-NEG-001 — Missing required field when creating job

- Steps: POST /jobs with body missing `type` → expect 400 with JSON error describing missing field.
- Image placeholder: docs/images/neg-job-create-01.png

---

## Regression Checklist (Run each release) ✅

Minimum required tests for every regression run (smoke + critical flows):

1. SMOKE: Health checks + frontend load (TC-SMOKE-001/002)
2. API: List & Get cluster endpoints (TC-API-CL-001/002)
3. Droplet provisioning flow (TC-API-DP-001 / TC-UI-DP-001)
4. Job processing lifecycle (TC-API-JOB-001/002 & TC-UI-JOB-001)
5. Monitoring basics (TC-MON-001/002)
6. Rate limit behaviour (TC-RL-001)
7. Kafka publish/consume verification (TC-KAFKA-001)

Be sure to run cleanup steps and restore seed data after tests that delete resources.

---

## Attachments and Images

Place any screenshots under `docs/images/` and link them using the placeholders shown in the steps.

---

## Final notes

If you want, I can expand any section into a per-screen check-list with exact API request payload examples, cURL commands for automation, or ready-made Postman collections / Cypress specs for these manual tests.

---

## Postman collection & E2E tests

I added a ready-to-import Postman collection and environment to quick-run API tests:

- Location: `docs/postman/ClusterGenie.postman_collection.json`
- Environment: `docs/postman/ClusterGenie.postman_environment.json`

Usage: Import both files into Postman, set `base_url` to your running instance and run requests in order. See `docs/postman/README.md` for notes.


I also scaffolded Playwright UI tests for core E2E sanity checks.

- Location: `e2e/playwright`
- Run: cd e2e/playwright && npm install && npm run install:browsers && npm test

The Playwright tests exercise cluster listing, cluster detail navigation and the provisioning create form. These are a good starting point for full CI integration; I can expand them into broader scenarios (jobs lifecycle, rate-limit stress tests) next.

---

## Example cURL requests (quick helpers)

Use these cURL snippets as a quick way to run the API-level tests from the command line. Replace {{BASE_URL}} with your environment (eg http://localhost:50052), and add auth headers if required.

---

### Health check

curl -s -X GET "{{BASE_URL}}/health" -H "Accept: application/json" | jq

### List clusters (TC-API-CL-001)

curl -s -X GET "{{BASE_URL}}/clusters" -H "Accept: application/json" | jq

### Get a cluster (TC-API-CL-002)

curl -s -X GET "{{BASE_URL}}/clusters/<CLUSTER_ID>" -H "Accept: application/json" | jq

### Create droplet / provisioning (TC-API-DP-001)

curl -s -X POST "{{BASE_URL}}/droplets" -H "Content-Type: application/json" -d '{
	"clusterId": "<CLUSTER_ID>",
	"image": "ubuntu-22-04",
	"flavour": "s-1vcpu-1gb",
	"region": "ams3",
	"name": "qa-test-01"
}' | jq

### Get droplet (TC-API-DP-002)

curl -s -X GET "{{BASE_URL}}/droplets/<DROPLET_ID>" -H "Accept: application/json" | jq

### Create job (TC-API-JOB-001)

curl -s -X POST "{{BASE_URL}}/jobs" -H "Content-Type: application/json" -d '{
	"type": "diagnose",
	"clusterId": "<CLUSTER_ID>",
	"params": {"target":"node-1"}
}' | jq

### Get job (TC-API-JOB-002)

curl -s -X GET "{{BASE_URL}}/jobs/<JOB_ID>" -H "Accept: application/json" | jq

### Cancel job (if supported) (TC-API-JOB-003)

curl -s -X POST "{{BASE_URL}}/jobs/<JOB_ID>/cancel" -H "Content-Type: application/json" | jq

---

Tip: Use a shell script to iterate requests for negative/limit tests; combine with jq to parse fields and check lifecycle transitions over time.

