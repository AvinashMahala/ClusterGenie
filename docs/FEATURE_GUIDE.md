# ClusterGenie — Feature Guide

Comprehensive developer and tester guide for frontend pages in ClusterGenie.

This document covers: UI walkthroughs (page-by-page), business workflows, testing instructions (sample data & expected behaviour), and links to related backend APIs.

> NOTE: This file summarizes the current frontend routes and components. It assumes the local backend is running on API_BASE configured in `frontend/src/lib/config.ts`. See backend docs in `/backend/docs` (swagger.json / swagger.yaml).

---

## Table of contents

1. Dashboard — `/`
2. Provisioning — `/provisioning` (overview / create / droplets)
3. Diagnosis — `/diagnosis` and cluster-level diagnosis view (Cluster page)
4. Jobs — `/jobs` and `/jobs/:id`
5. Monitoring — `/monitoring`
6. Autoscaling — `/autoscaling`
7. Deployments — `/deployments`
8. Providers — `/providers`
9. Billing — `/billing`
10. Limiter Rules (Admin) — `/admin/limiter-rules`
11. Clusters — `/clusters`, `/clusters/new`, `/clusters/:id`

---

## High-level notes

- Repo paths useful when writing or updating UI docs:
  - Frontend pages: `frontend/src/components/*` (e.g., `Dashboard.tsx`, `ProvisioningPanel.tsx`, etc.)
  - Frontend services & repositories: `frontend/src/services/*` and `frontend/src/repositories/*` — map to backend endpoints.
  - Backend API docs: `backend/docs/swagger.yaml` and `backend/docs/swagger.json`.

- Common UI building blocks used across pages:
  - Panels: `Panel`, `PanelHeader`, `PanelContent` (common UI layout)
  - Form controls: `Input`, `Select`, `FormField`, `ActionButton`
  - Common state UI: `LoadingSpinner`, `EmptyState`, `Alert`, `StatusBadge`, `Toast` provider

  ---

  ### API dependency quick map (page → key backend endpoints)

  | Frontend page | Key backend endpoints (examples) | Primary frontend service |
  |---|---|---|
  | Dashboard | POST /hello, GET /droplets, GET /jobs | ProvisioningService, JobService |
  | Provisioning | GET /droplets, POST /droplets, DELETE /droplets/:id | ProvisioningService |
  | Diagnosis | POST /diagnosis/diagnose, GET /metrics | DiagnosisService, MonitoringService |
  | Jobs | GET /jobs, POST /jobs, GET /jobs/:id | JobService |
  | Monitoring | GET /metrics, GET /observability/rate-limit, GET /workers | MonitoringService, ObservabilityService |
  | Autoscaling | GET /policies?cluster_id=, POST /policies, PUT /policies/:id | AutoscalingService |
  | Deployments | GET /deployments?cluster_id=, POST /deployments, POST /deployments/:id/rollback | DeploymentService |
  | Providers | GET /providers, POST /providers, POST /providers/schedule | ProviderService |
  | Billing | GET /billing/estimate?cluster_id= | BillingService |
  | Limiter Rules | GET /rate-limit-configs, POST /rate-limit-configs, DELETE /rate-limit-configs/:key | ObservabilityService |
  | Clusters | GET /clusters, POST /clusters, GET /clusters/:id, PUT /clusters/:id, DELETE /clusters/:id | ClusterService |

  Refer to backend swagger files for exact request/response contracts: `backend/docs/swagger.yaml` and `backend/docs/swagger.json`.

---

## 1. Dashboard — `/`

### What the user sees (UI walkthrough)

- Hero header: title, subtitle and quick system stats.
- Three tabbed views: System Status, Quick Actions, Recent Activity.
- System Status: small cards for Backend API, Droplets, Jobs, Database.
- Quick Actions: action cards linking to other pages (provisioning, diagnosis, jobs, monitoring).
- Recent Activity: table-like `TabularSection` showing recent jobs (search + status filters).

### UI components

- `Hero`, `TabNavigation` style buttons, `StatusBadge`, `TabularSection`, `Link` (react-router), small inline cards and counters.

### Expected user interactions

- Switch tabs — toggles visible content.
- Click quick action cards — navigates to other pages.
- Search/filter in Recent Activity — filters jobs list.

### Edge cases to handle

- Backend offline or /hello endpoint non-responsive → dashboard shows 'offline' backend status and user-friendly fail state.
- No droplets or jobs → show empty states with CTAs to create resources.

### Business workflow & dependencies

- Purpose: A single-pane overview and jump-off hub for system tasks.
- Dependencies:
  - ProvisioningService.listDroplets → for droplet counts.
  - JobService.listJobs → for recent activity.
  - REST health check `POST /hello` used to infer API availability.

### Preconditions & assumptions

- Backend API reachable and authenticated (if auth required by deployment).

### Testing instructions (manual)

Sample data: create a few droplets, and create jobs with statuses (running, pending, completed).

Expected behaviour:
- Dashboard loads with counts matching backend (Droplets, Jobs).
- Backend status toggles correctly between checking/online/offline.

Valid/Invalid inputs: none — mostly read-only with nav interactions.

Error states:
- If API returns error during status check or list requests, show offline state and empty lists.

Manual test steps:
1. Start backend and ensure `/hello` responds. Open dashboard — verify backend shows ‘online’.
2. Populate backend with droplets and jobs using sample scripts or APIs. Verify counts update.
3. Click Quick Actions and confirm navigation to target pages.

---

## 2. Provisioning — `/provisioning`

This page contains three tabs: Overview, Create droplet, Droplets list.

### Overview tab (UI walkthrough)

- Stats summary (droplet counts). Quick deploy templates (pre-filled forms). Links to create or view droplets.

### Create droplet tab

- Form fields: name, optional cluster selection (dropdown), provider, region, size, image.
- Actions: Create droplet button. Shows toasts for success/failure.

### Droplets list tab

- Lists droplets with actions to refresh and delete. Shows highlighted ID briefly after creation.

### UI components

- `Hero`, `TabNavigation`, `CreateDropletTab`, `DropletsListTab`, `ToastProvider`, `Form` elements.

### Business workflow & dependencies

- Creates cloud resources (simulated) via `provisioningService.createDroplet` → backend `/droplets` POST.
- Lists via `provisioningService.listDroplets` → backend `/droplets` GET.
- Delete via `/droplets/:id` DELETE.

Preconditions:
- Backend provisioning APIs reachable and returning appropriate formats

How it fits overall:
- Primary entry point to create droplets which other flows (clusters, deployments, monitoring) rely on.

### Edge cases

- Attempt to create with missing or invalid provider or cluster_id → backend returns error; page shows contextual error or cluster-specific error message.
- Number or ID collisions; long-running provisioning showing 'pending' until status flips.

### Testing instructions

Sample data & scenarios:
- Valid: name 'demo-1', region 'nyc1', size 's-1vcpu-1gb', image 'ubuntu-20-04-x64'.
- Invalid: empty name, unknown cluster id or provider returns 'cluster not found'.

Expected behaviour:
- Create: page shows toast success and switches to droplets tab with new item highlighted.
- Create with invalid cluster: `clusterError` shown and creation blocked.
- Delete: removes droplet and reload list; handle failures gracefully.

Manual test steps:
1. Open /provisioning. Switch to 'create', fill valid form, click Create. Validate toast and item in droplets list.
2. Enter cluster id that doesn't exist → verify cluster-specific error shown.
3. Use Overview quick deploy button to pre-fill form and verify behavior.

---

## 3. Diagnosis — `/diagnosis` (+ cluster-level diagnosis view)

This page provides AI-powered cluster analysis, quick recommendations and the ability to convert recommendations into jobs.

### UI walkthrough

- Header with actions (Diagnose button + Auto-refresh toggle).
- Tabs: Current Analysis, History, Analytics (visualizations).
- Current Analysis includes cluster selection (dropdown + typed input), quick action presets (Demo cluster), results area with health score, cluster overview, recommendations list and a metrics chart.

### UI components

- `Panel`, `PanelHeader`, `FormSection`, `Card`, `ActionButton`, `StatusBadge`, `ErrorMessage`.

### Business workflow & dependencies

- Calls `diagnosisService.diagnoseCluster` → backend `POST /diagnosis/diagnose`.
- Fetches metrics via `monitoringService.getMetrics` → backend `/metrics` endpoints.
- Can create job(s) via `jobService.createJob` → backend `/jobs` POST.

Preconditions:
- Cluster ID is provided and clusters list available for selection.

How it fits:
- Produces recommendations that can be converted into Jobs (provisioning, scaling, monitoring), linking diagnosis to automation.

### Edge cases & behaviors to harden

- Empty or invalid cluster ID — show input validation and error.
- Long-running analyze calls — show loading states and disable repeated submits.
- Auto-refresh toggling should restart interval logic correctly and not leak timers.

### Testing instructions

Sample data:
- Use cluster id 'cluster-demo' or 'test-cluster-1' (these are referenced in UI). Mock server responses to include `DiagnosisResponse` with status field, `recommendations`, `cluster` details, and sample metrics.

Valid scenarios:
- Diagnosis returns healthy → show score >= 80 and action buttons enabled.
- Diagnosis returns warning or critical → adjust score and show relevant recommendations.

Invalid scenarios:
- Backend returns 4xx/5xx → error message visible and diagnosis not populated.

Manual test steps:
1. Choose cluster from dropdown (or type) and click 'Diagnose Cluster'.
2. Confirm health score, overview cards, recommendations list appear.
3. Click 'Implement' for a recommendation → verify job created and implemented state toggles.
4. Turn on Auto-refresh and check repeated calls every 30 seconds when data available.

---

## 4. Jobs — `/jobs` and `/jobs/:id`

### Jobs list (/jobs)

UI walkthrough:

- Header with Refresh button; Create Job form (job type select). 
- Table of recent jobs (sortable by date and id) with progress column, status and details.

Components:
- `Panel`, `PanelHeader`, `FormSection`, `Select`, `ActionButton`, `StatusBadge`, `EmptyState`.

Business logic & dependencies:

- Uses `jobService.listJobs(page, pageSize, sortBy, sortDir)` → backend `/jobs`.
- Creates using `jobService.createJob` → backend `/jobs` POST.
- Polls jobs periodically (every 3s) for updates while page mounted.

Edge cases:

- Table empty state, server errors, creating job failure.

Testing instructions:

Sample data: mix of job statuses: running/pending/completed/failed, with progress numbers and optional result/error fields.

Manual tests:
1. Create a job via the form, verify it appears in table.
2. Click row to navigate to `/jobs/:id`.
3. Toggle sort and page size and verify results.

### Job details (/jobs/:id)

UI walkthrough:

- Read-only details: status, type, created/completed timestamps, parameters, result and error areas.

Business logic:

- Uses `jobService.getJob(id)` → backend `/jobs/:id`.

Testing steps:

1. With a known job id, open details page and verify fields.
2. Mock job error responses and verify error area displays correctly.

---

## 5. Monitoring — `/monitoring`

### UI walkthrough

- Control panel: cluster selector, metric type selector, refresh button.
- Observability cards: Rate limit status, Worker Pool status, Grafana embed option.
- Current metrics summary and table with history.
- Rate-limit config and management section (persisting to Redis via backend).

### Dependencies

- `monitoringService.getMetrics(clusterId, metricType, page, pageSize)` → backend `/metrics`.
- ObservabilityService endpoints → rate-limit, worker pool, rate-limit config (e.g., `/observability/rate_limit` etc.)

### Edge cases

- No cluster selected: metrics for all clusters (or first cluster selected by default if available).
- Grafana embedding blocked if CORS or GRAFANA_URL misconfigured.

### Testing instructions

Sample data: stub metrics for CPU/memory/disk/network with timestamp, value and unit.

Manual tests:
1. Select different clusters and metric types; click Refresh — verify metrics update.
2. Toggle Grafana embed — verify iframe loads if GRAFANA_URL configured.
3. Manage rate-limit config: fetch, modify and save; verify status saved via backend.

---

## 6. Autoscaling — `/autoscaling`

### UI walkthrough

- Topbar to pick cluster, evaluate, refresh, and create policies.
- Left side templates and quick create; right side policies list with filters and actions.
- Policy drawer for detailed view and editor modal (`PolicyEditor`).

### Dependencies & business logic

- `AutoscalingService` endpoints: listPolicies, createPolicy, updatePolicy, deletePolicy, evaluate.
- `monitoringService.getMetrics` used for rendering small metric previews.

### Edge cases

- If no cluster selected: prompt to select cluster.
- Editor validation for numeric ranges and required fields.

### Testing instructions

Sample data: cluster with id `cluster-demo` and policies with variety of types (metrics/time_of_day/cost). 

Manual test steps:
1. Select a cluster, create a policy from CPU template — verify it appears in list.
2. Edit/duplicate/delete policy and verify state updates and backend calls.
3. Evaluate policies via the Evaluate action and inspect results modal.

---

## 7. Deployments — `/deployments`

UI walkthrough:

- Cluster selector, start deployment form (version, strategy, target %), recent rollouts.

Business logic:

- `DeploymentService` endpoints: listDeployments(cluster_id), startDeployment, rollback.

Testing instructions:

1. Select a cluster and start a deployment; confirm it appears in 'recent rollouts'.
2. Trigger rollback and verify the state change.

---

## 8. Providers — `/providers`

UI walkthrough:

- Create providers for multi-cloud simulation; schedule (placement) and migrate droplet flows.

Dependencies:

- `ProviderService` endpoints: listProviders, createProvider, schedule, migrate.

Testing:

1. Create provider and confirm listed. 2. Use schedule with cluster id to simulate placement result. 3. Use migrate with a droplet id and target provider.

---

## 9. Billing — `/billing`

UI walkthrough:

- Cluster selector and 'Estimate' action that returns droplet_count, hourly_cost, monthly_cost.

Dependencies:

- `BillingService.estimateCluster(clusterId)` → backend billing endpoint.

Testing steps:

1. Select cluster and click Estimate. Verify expected numbers or error if cluster missing.

---

## 10. Limiter Rules (Admin) — `/admin/limiter-rules`

UI walkthrough:

- Search form to find persisted limiter rules, a list showing scope & config, and delete actions.

Dependencies:

- `ObservabilityService` endpoints: listRateLimitConfigs, deleteRateLimitConfig.

Testing:

1. Create and fetch rules; delete and confirm removal.

Edge cases: Permission gating (admin-only) and empty states to be shown clearly.

---

## 11. Clusters — `/clusters`, `/clusters/new`, `/clusters/:id`

High-level:

- The cluster management area includes listing + filtering clusters, create cluster, and a detailed cluster page with tabs (overview/droplets/diagnosis).

### `/clusters` — List & manage

UI & components:
- Table with search, filters (status), quick create link, edit inline, delete.

Dependencies & business logic:
- `ClusterService.listClusters()` / `createCluster` / `updateCluster` / `deleteCluster`.

Testing:

1. Create, edit, delete clusters. Verify filters and sorting function correctly.

### `/clusters/new` — Create cluster

UI: name + region select, Create button.

Testing steps: try valid and empty names; verify create navigates to /clusters.

### `/clusters/:id` — Cluster details

UI: header with metadata, tabs (overview/droplets/diagnosis), quick actions.

Dependencies: relies on ClusterService.getCluster and ProvisioningService.listDroplets to compute cluster-local droplets.

Testing:

1. Open cluster with and without droplets. 2. Switch tabs and run diagnosis on the page; ensure appropriate data load and error states.

---

## Shared testing patterns and sample data

- Use consistent test fixtures across pages to avoid divergent test states. Example items:
  - Clusters: { id: 'cluster-demo', name: 'Demo Cluster', region: 'nyc1', droplets: ['droplet-1','droplet-2'], status: 'healthy' }
  - Droplets: { id: 'droplet-1', name: 'demo-droplet', status: 'active', size: 's-1vcpu-1gb', image: 'ubuntu-20-04-x64' }
  - Jobs: { id: 'job-123', type: 'provision', status: 'running', progress: 42 }
  - Autoscale policies with types: metrics/time_of_day/cost

Shared error states to verify: backend timeouts, 400/404/500 responses, CORS or Grafana embedding failures.

---

## Developer references & links

- Frontend services & repositories: `frontend/src/services` and `frontend/src/repositories` (implement API calls).
- Backend API specification (Swagger): `backend/docs/swagger.yaml` and `backend/docs/swagger.json` — inspect for exact endpoints and payload shapes.
- Backend core API server code: `backend/core-api` (Go) — handlers and models for each endpoint.

---

## Diagrams & Flowcharts (simple)

1) High-level flow: User Interaction → Frontend Service → Repository (axios) → Backend REST API → Data stores (Postgres / Redis) → Observability / Grafana

2) Example 'Diagnose → Implement' flow:

- User chooses cluster → frontend calls POST /diagnosis/diagnose → receives DiagnosisResponse including 'recommendations' → user clicks 'Implement' → frontend calls POST /jobs to create an appropriate job (scale/provision/monitor) → background worker executes job → job status updates visible in /jobs.

---

## Final notes & suggestions for maintainers

- Keep this doc in sync if new pages, tabs or API endpoints are added. Prefer documenting new fields and sample request/response payloads (or link to the swagger file) for testers.
- Add a small JSON fixtures folder under `tests/sample-data` and reference them in E2E test suites — provides consistent test inputs for each page.

---

If you'd like, I can now:

- Add example JSON fixtures under `tests/sample-tests` for the most common pages (clusters, droplets, jobs).
- Generate a one-page checklist to use for end-to-end QA based on this guide.
 
---

## Interview-ready: Cross-question Q&A & Quick Reference 🧭

To help you answer cross-questions during interviews, here are concise prompts, sample short answers, and where to find the relevant code or docs in this repo. Use the short answers for verbal replies and consult the pointers for deeper follow-ups.

### How to use this section
- Keep answers short (1–2 sentences) when asked live; offer to expand and point to a file or function in the repo for detail. Each entry below contains: the short answer, 1–2 lines of follow-up context if needed, and a pointer to the implementation or docs.

---

### Typical cross-questions and suggested replies

- Q: "How does the frontend determine API availability (health checks)?"
  - Short answer: The frontend calls POST /hello to check API availability and toggles an 'online/offline' state used across pages.
  - Pointer: frontend services → check `frontend/src/services` + backend handler in `backend/core-api/handlers.go` and `backend/docs/swagger.yaml`.

- Q: "If a Diagnosis recommendation needs to become an automated action, how is that implemented?"
  - Short answer: The frontend converts the recommendation into a Job by calling POST /jobs; background workers then execute the job and the frontend polls /jobs for status updates.
  - Pointer: `frontend` diagnosis UI → `diagnosisService` / `jobService` and backend endpoints in `backend/core-api` (jobs handlers).

- Q: "Where are the autoscaling policies evaluated and where can I test policy simulations locally?"
  - Short answer: Policies are evaluated by `AutoscalingService` endpoints. Use the Evaluate action on UI or backend endpoints to run a simulation and inspect returned evaluation data.
  - Pointer: frontend autoscaling components in `frontend/src/components` and backend service handlers under `backend/core-api/services` (search for autoscale/evaluate endpoints).

- Q: "How do we trace or debug long-running jobs in the system?"
  - Short answer: Check Jobs UI for progress and logs — frontend polls /jobs every few seconds. For deeper traces, inspect backend job worker logs and observability (Prometheus/Grafana).
  - Pointer: `frontend/src/components/Jobs*` and backend job worker implementations (look under `backend/core-api/test` and logs in `logs/` or `monitoring/`).

- Q: "If a droplet create operation fails with a 400/500, how should the UI respond?"
  - Short answer: Show contextual error to the user (toast + inline field errors) and allow retry; errors are surfaced from the backend API response.
  - Pointer: Create form logic in `frontend/src/components/Provisioning/CreateDropletTab.tsx` and API error handling in `frontend/src/services`.

- Q: "What would you change to add role-based access for actions like deleting limiter rules?"
  - Short answer: Add authorization middleware in backend endpoints and gate UI actions based on a user role from an auth provider; update tests to cover allowed/denied flows.
  - Pointer: Backend middleware in `backend/core-api/middleware` (ratelimit exists as example), and UI admin pages like `/admin/limiter-rules`.

- Q: "How can the Diagnose → Implement flow be tested end-to-end in CI?"
  - Short answer: Create deterministic fixtures that mock diagnosis responses, wire tests that call the Diagnose endpoint, then assert a Job is created and transitions states; use E2E (playwright) for the front-to-back flow.
  - Pointer: E2E tests in `e2e/playwright/tests` and sample fixtures under `tests/sample-tests`.

- Q: "How are metrics and rate-limit configs persisted? Which data stores do we use?"
  - Short answer: Metrics come from monitoring services (Prometheus) and rate-limit configs are persisted via backend storage (likely Redis/config store); check the Observability endpoints in swagger.
  - Pointer: `monitoring/` resources, and backend `observability` handler definitions in docs and `backend/core-api`.

- Q: "Where to look for the cluster-to-droplet relationship in code?"
  - Short answer: Clusters reference droplets via the `ClusterService` and provisioning endpoints return droplet metadata; the UI aggregates using ClusterService + ProvisioningService calls.
  - Pointer: `frontend` cluster pages and backend `clusterRepository.go` + `provisioningRepository.go`.

---

### Rapid interview cheat-sheet (one-liners you can memorize)

| Topic | Short reply (1–2 lines) | Quick pointer |
|---|---:|---|
| Health checks | POST /hello — front uses that to detect API status | `backend/docs/swagger.yaml`, `frontend/src/services` |
| Diagnose → Implement | POST /diagnosis/diagnose → POST /jobs to convert recs to jobs | `frontend/src/components/Diagnosis*`, `backend/core-api/handlers.go` |
| Jobs & polling | UI polls /jobs, jobs show progress and results; worker updates backend | `frontend/src/components/Jobs*`, `backend/core-api/test` |
| Autoscaling evaluation | Evaluate API and UI preview — use Evaluate to simulate | `frontend/src/components/Autoscaling*` |
| Observability | Metrics from Prometheus + rate-limit configs via observability endpoints | `monitoring/`, `backend/docs` |

---

### Interview tips & follow-up prompts (use during answers)
- When you describe design: briefly state tradeoffs and then show the code pointer. e.g., "I chose X for simplicity — here's where you can see it in the repo."  
- For performance / debugging questions: reference `monitoring/` and `logs/` first, then tracing points in `backend/core-api`.
- For security / role-based questions: mention adding middleware and tests first (concept), then `backend/core-api/middleware` for an example.

---

If you'd like, I can also:
- Convert these Q&A entries into a printable one-page `docs/INTERVIEW_CHEAT_SHEET.md` and add a few mock interview prompts with model answers.
- Generate a small set of flashcards under `tests/sample-tests/fixtures-interview` so you can rehearse quickly.

Happy to continue — tell me which follow-up you'd prefer. ✅

Happy to continue — tell me which follow-up you'd prefer. ✅
