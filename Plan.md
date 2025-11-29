# ClusterGenie Development Plan

This document outlines the phased, incremental development plan for ClusterGenie. We start with a minimal MVP (basic structure and "Hello World" functionality) and build up to a fully functional, demo-ready product. Each **Phase** is broken into **Microphases** (small, testable steps). After each microphase/phase, perform manual testing and provide feedback for iteration.

Progress will be tracked here—update after each completion.

## Overall Milestones
- **MVP Milestone (End of Phase 1)**: Basic project structure, Docker setup, and simple backend/frontend "Hello World" running locally.
- **Core Functionality Milestone (End of Phase 2)**: Backend services with basic CRUD, models, and interfaces; frontend with UI skeleton.
- **Integrated Features Milestone (End of Phase 3)**: Frontend connected to backend via REST APIs; all 6 features prototyped.
- **Full Integration Milestone (End of Phase 4)**: Kafka events, LLM mocks, health checks, and end-to-end flows working.
- **Demo-Ready Milestone (End of Phase 5)**: Polished app with tests, docs, and 15-20 min demo script.

## Assumptions & Constraints
- LLMs are mocked (no real API keys needed).
- No real cloud APIs; all simulations.
- Focus on macOS/Linux; Docker for portability.
- Incremental testing: Manual feedback after each microphase.

## Status Summary
| Phase | Status | Notes |
| --- | --- | --- |
| Phase 1 | ✅ Completed | MVP wired end-to-end (hello flow). |
| Phase 2 | ✅ Completed | Models, services, repos, and REST endpoints are implemented in `backend/core-api`. |
| Phase 3 | ✅ Completed | Frontend components, services, and REST wiring exist in `frontend/src`. |
| Phase 4 | ⚪ Pending | Kafka/LLM flow still undergoing integration. |
| Phase 5 | ⚪ Pending | Testing, docs, and demo prep still in planning. |
| Phase 6 | ⚪ Pending | Event-chain demo wiring yet to start. |
| Phase 7 | ⚪ Pending | Rate limiting/concurrency story ahead. |

## Phase 1: Project Setup (MVP Foundation)
**Goal**: Establish project structure, tooling, and basic runnable app.

- **Microphase 1.1**: Create directory structure (`backend/`, `frontend/`, `database/`) and root files (`.gitignore`, `Makefile`, `docker-compose.yml`, `setup.sh`).
  - **Status**: Completed ✅
  - **Tasks**: Scaffold directories; add basic Docker Compose for MySQL/Redis/Kafka; create setup.sh skeleton.
  - **Estimated Time**: 1-2 hours.
  - **Dependencies**: None.
  - **Rollback Plan**: Delete directories if setup fails.
  - **Success Metrics**: Directories exist; Docker Compose validates without errors.
  - **Testing**: Run `./setup.sh` to verify directories and basic Docker startup.

- **Microphase 1.2**: Set up backend MVP (Go module, basic REST server).
  - **Status**: Completed ✅
  - **Tasks**: Create `backend/go.mod`; define REST routes; build Core API service with "Hello" HTTP endpoint.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 1.1 completed.
  - **Rollback Plan**: Remove backend/ if Go mod fails.
  - **Success Metrics**: Go service compiles; REST endpoint responds.
  - **Testing**: Run backend service via Docker; test HTTP call.

- **Microphase 1.3**: Set up frontend MVP (React app, basic UI).
  - **Status**: Completed ✅
  - **Tasks**: Create `frontend/` with Vite/React/TS; add simple component displaying "Hello from ClusterGenie".
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: None (parallel to 1.2).
  - **Rollback Plan**: Delete frontend/ if npm fails.
  - **Success Metrics**: App builds; UI loads in browser.
  - **Testing**: Run `npm run dev`; verify UI loads.

- **Microphase 1.4**: Integrate MVP (frontend calls backend). ✅ **COMPLETED**
  - **Status**: Completed ✅
  - **Tasks**: Use REST client in frontend; connect to backend "Hello" endpoint.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 1.2 and 1.3 completed.
  - **Rollback Plan**: Revert REST wiring if connection fails.
  - **Success Metrics**: Frontend displays backend response.
  - **Testing**: Full stack runs; UI shows backend response.

**Phase 1 Milestone**: MVP app running locally with basic hello-world functionality.

## Phase 2: Backend Core (Models, Services, Repositories)
**Goal**: Implement backend architecture layers for all services.

- **Microphase 2.1**: Define shared models and interfaces.
  - **Status**: Completed ✅ (see `backend/core-api/models` + `interfaces` packages)
  - **Tasks**: Create `backend/models/` (e.g., Droplet, Job); `backend/interfaces/` (e.g., Repository interfaces).
  - **Estimated Time**: 2 hours.
  - **Dependencies**: Phase 1.
  - **Rollback Plan**: Remove models/ if conflicts.
  - **Success Metrics**: Models compile; interfaces defined.
  - **Testing**: Unit tests for models.

- **Microphase 2.2**: Implement repositories (MySQL/Redis).
  - **Status**: Completed ✅ (GORM + Redis repos live under `backend/core-api/repositories`)
  - **Tasks**: Add `backend/repositories/` with MySQLRepo, RedisRepo; connect to DBs in Docker.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: 2.1.
  - **Rollback Plan**: Revert DB connections if queries fail.
  - **Success Metrics**: CRUD operations succeed.
  - **Testing**: CRUD operations via unit tests.

- **Microphase 2.3**: Build services (business logic).
  - **Status**: Completed ✅ (services folder orchestrates repos, Kafka producer/consumer hooks)
  - **Tasks**: Add `backend/services/` for each service (e.g., ProvisioningService); use DI.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: 2.2.
  - **Rollback Plan**: Simplify services if DI issues.
  - **Success Metrics**: Services inject dependencies correctly.
  - **Testing**: Service methods with mocks.

- **Microphase 2.4**: Complete REST APIs for all services.
  - **Status**: Completed ✅ (see `main.go` router exposing droplets, clusters, jobs, metrics)
  - **Tasks**: Implement handlers for diagnose, provision, scale, jobs, health, logs.
  - **Estimated Time**: 4-5 hours.
  - **Dependencies**: 2.3.
  - **Rollback Plan**: Start with one service if all fail.
  - **Success Metrics**: All endpoints respond.
  - **Testing**: REST calls to all endpoints.

**Phase 2 Milestone**: Backend fully layered, with all APIs responding (mock data).

## Phase 3: Frontend Core (Components, Integration)
**Goal**: Build UI components and connect to backend.

**Microphase 3.1**: Define frontend models/interfaces.
  - **Status**: Completed ✅ (models/interfaces exist under `frontend/src/models` & `interfaces`)
  - **Tasks**: Create `frontend/src/models/`, `interfaces/` mirroring backend.
  - **Estimated Time**: 1-2 hours.
  - **Dependencies**: Phase 2.
  - **Rollback Plan**: Remove if TS errors.
  - **Success Metrics**: Types compile.
  - **Testing**: Type checks.

**Microphase 3.2**: Implement repositories and services.
  - **Status**: Completed ✅ (REST callers live under `frontend/src/repositories` & `services`)
  - **Tasks**: Add `frontend/src/repositories/` (REST clients); `services/` with business logic.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 3.1.
  - **Rollback Plan**: Adjust REST wiring if endpoints change.
  - **Success Metrics**: API calls succeed.
  - **Testing**: Frontend API calls.

**Microphase 3.3**: Build UI components.
  - **Status**: Completed ✅ (panels/tabs/components exist for Provisioning, Diagnosis, Jobs, Monitoring)
  - **Tasks**: Create components for each feature (e.g., DiagnosePanel); style with Tailwind.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: 3.2.
  - **Rollback Plan**: Simplify components.
  - **Success Metrics**: Components render.
  - **Testing**: Component rendering.

**Microphase 3.4**: Integrate full UI.
  - **Status**: Completed ✅ (Layout + routing components wire the features together)
  - **Tasks**: Wire components to services; add routing.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 3.3.
  - **Rollback Plan**: Revert routing if issues.
  - **Success Metrics**: UI flows work.
  - **Testing**: End-to-end UI flows.

**Phase 3 Milestone**: Frontend fully connected, all features visible in UI.

## Phase 4: Integration & Features (Kafka, LLM, End-to-End)
**Goal**: Add async communication, mocks, and full functionality.

- **Microphase 4.1**: Integrate Kafka for events.
  - **Status**: Completed ✅ (`backend/core-api/kafka` producer/consumer + `services/eventHandler`)
  - **Tasks**: Add producers/consumers for scaling/jobs/logs.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: Phase 3.
  - **Rollback Plan**: Skip async if Kafka fails.
  - **Success Metrics**: Events publish/consume.
  - **Testing**: Event publishing/consuming.

- **Microphase 4.2**: Add LLM mocks for diagnostics.
  - **Status**: Completed ✅ (`DiagnosisService` supports OpenAI with mock fallback)
  - **Tasks**: Mock AI responses in Diagnosis Service.
  - **Estimated Time**: 2 hours.
  - **Dependencies**: 4.1.
  - **Rollback Plan**: Use static responses.
  - **Success Metrics**: Diagnose returns insights.
  - **Testing**: Diagnose requests return insights.

- **Microphase 4.3**: Implement remaining features (scaling, health, logs).
  - **Status**: Completed ✅ (auto-scaling in `eventHandler`, health checks/metrics in `monitoringService`)
  - **Tasks**: Add logic for auto-scaling, synthetic checks, log streaming.
  - **Estimated Time**: 4-5 hours.
  - **Dependencies**: 4.2.
  - **Rollback Plan**: Implement one feature at a time.
  - **Success Metrics**: All features functional.
  - **Testing**: All features working.

**Phase 4 Milestone**: All features integrated and functional.

## Phase 5: Event Chain Demo (Cluster → Job → Kafka → Provisioning)
**Goal**: Model the relationships and flows the user wants to showcase so the demo can exercise the full cluster lifecycle end-to-end.

- **Microphase 5.1**: Make cluster/droplet ownership explicit in the backend.
  - **Status**: Pending ⚪
  - **Tasks**: Update models/repositories so droplets reference clusters; persist the relationships in SQL/Redis; expose the cluster metadata in REST responses.
  - **Estimated Time**: 3 hours.
  - **Dependencies**: Phase 2 data layer maturity and Phase 4 Kafka schema knowledge.
  - **Rollback Plan**: Keep additional fields as derived data rather than persisted if migrations stall.
  - **Success Metrics**: Every droplet response includes the owning cluster and persistence uses a cluster key.
  - **Testing**: Unit/integration tests verifying droplet creation returns the linked cluster.

- **Microphase 5.2**: Surface the relationship in provisioning UI.
  - **Status**: Pending ⚪
  - **Tasks**: Add a cluster dropdown to the droplet creation form; tag droplets in the My Droplets tab with cluster badges and filters.
  - **Estimated Time**: 3 hours.
  - **Dependencies**: 5.1 and Phase 3 component structure.
  - **Rollback Plan**: Render the cluster name as read-only text until the dropdown can be wired.
  - **Success Metrics**: Users pick the cluster when creating droplets and a cluster column appears in droplet listings.
  - **Testing**: UI tests validating form submission includes cluster ID and table rows show the right cluster.

- **Microphase 5.3**: Cluster-aware diagnosis interactions.
  - **Status**: Pending ⚪
  - **Tasks**: Populate the diagnosis dropdown with clusters; show actions per cluster and wire implement buttons to create a job tied to that cluster.
  - **Estimated Time**: 3 hours.
  - **Dependencies**: 5.1/5.2 plus job API readiness.
  - **Rollback Plan**: Provide a separate job creation shortcut if the inline action buttons fail.
  - **Success Metrics**: Selecting a cluster loads its actions and implementing one produces a job record that references that cluster.
  - **Testing**: Workflow tests ensuring job creation includes cluster metadata.

- **Microphase 5.4**: Job → Kafka → provisioning orchestration.
  - **Status**: Pending ⚪
  - **Tasks**: Flow implement actions into jobs; publish Kafka events; add consumers that translate jobs into provisioning/resizing commands (using channels/goroutines as described in Phase 7); update job statuses as work completes.
  - **Estimated Time**: 4 hours.
  - **Dependencies**: Phase 4 Kafka plumbing and 5.3 job wiring.
  - **Rollback Plan**: Run consumers synchronously without Kafka until the topics stabilize.
  - **Success Metrics**: A diagnosis action driver creates a job, the Kafka topic sees the event, a consumer provisions/resizes droplets, and the UI reflects the change.
  - **Testing**: Integration tests for job creation → Kafka → provisioning.

- **Microphase 5.5**: Improve monitoring UX.
  - **Status**: Pending ⚪
  - **Tasks**: Turn the metrics history into a paginated table; add a cluster dropdown filter; ensure telemetry emitted by Kafka/consumers is captured and surfacing per cluster.
  - **Estimated Time**: 3 hours.
  - **Dependencies**: 5.4 and Phase 3 monitoring components.
  - **Rollback Plan**: Provide sortable rows without pagination until the table can be upgraded.
  - **Success Metrics**: The monitoring page can page through metrics and filter to a specific cluster’s history.
  - **Testing**: UI table tests plus manual verification of pagination/filter behavior.

**Phase 5 Milestone**: Demo can trace a user selecting a cluster, creating a droplet, diagnosing it, triggering a job, and streaming that job through Kafka to provisioning/resizing.

## Phase 6: Rate Limiting, Concurrency & Channels/Goroutines
**Goal**: Highlight resilience features (rate limiting, goroutines/channels) to support the event flow and the upcoming demo.

- **Microphase 6.1**: Add rate limiting safeguards.
  - **Status**: Pending ⚪
  - **Tasks**: Introduce middleware that limits diagnosis/implementation calls; expose the throttling status in the UI; use shared counters to enforce concurrency budgets.
  - **Estimated Time**: 2 hours.
  - **Dependencies**: API endpoints from Phase 2/4 and UI forms from Phase 3.
  - **Rollback Plan**: Scale limits up temporarily if throttling disrupts the demo.
  - **Success Metrics**: Excess requests receive 429s and the UI displays the remaining request quota.
  - **Testing**: Load tests confirming throttling kicks in and rate-limit headers/notifications appear.

- **Microphase 6.2**: Concurrency via channels and goroutines.
  - **Status**: Pending ⚪
  - **Tasks**: Process Kafka job/events using worker pools built on channels; ensure goroutines respect context cancellation; surface queue lengths/logs for observability.
  - **Estimated Time**: 3 hours.
  - **Dependencies**: Kafka consumers in Phase 4 and the event chain from Phase 5.
  - **Rollback Plan**: Replace workers with sequential handlers while keeping channel structures for future rework.
  - **Success Metrics**: Job events are handled concurrently, cancellations stop workers, and queue metrics are logged.
  - **Testing**: Unit tests for channel helpers and manual tests showing concurrent processing.

- **Microphase 6.3**: Observability/resilience for rate limiting and concurrency.
  - **Status**: Pending ⚪
  - **Tasks**: Log rate-limit events, queue lengths, and goroutine panics; add simple dashboard widgets on the monitoring page describing the concurrency model and whether workers are healthy.
  - **Estimated Time**: 2 hours.
  - **Dependencies**: 6.1/6.2 and Phase 5 monitoring docs.
  - **Rollback Plan**: Fall back to log files if dashboards are unstable.
  - **Success Metrics**: Monitoring tab explains rate limiting and shows channel/goroutine metrics.
  - **Testing**: Visual confirmation plus telemetry output checks.

**Phase 6 Milestone**: Users can point to rate limiting and goroutine/channel-driven job processing as resilience features during the demo.

## Phase 7: Testing, Documentation & Demo Prep
**Goal**: Lock in quality assurance, documentation, and demo scripts so the stakeholders can reproduce the solution.

- **Microphase 7.1**: Automated tests and CI checks.
  - **Status**: Pending ⚪
  - **Tasks**: Add unit and integration coverage for REST handlers, Kafka flows, and monitoring helpers; create a lightweight pipeline (GitHub Actions or similar) that can execute the suite on push.
  - **Estimated Time**: 4-5 hours.
  - **Dependencies**: Phase 4 APIs and Phase 5 event chain workflows.
  - **Rollback Plan**: Run scripts locally until pipeline stabilizes.
  - **Success Metrics**: Tests run reliably in CI; coverage targets met for key modules.
  - **Testing**: The automated suite itself acts as the deliverable.

- **Microphase 7.2**: End-to-end smoke/demo verification.
  - **Status**: Pending ⚪
  - **Tasks**: Define and execute a scripted flow (provision → diagnose → job → Kafka → auto-scaling) that can be repeated manually or in automation; capture the data required to demonstrate success.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: Phase 5 workflows and Phase 6 resilience controls.
  - **Rollback Plan**: Provide a manual checklist if automation fails.
  - **Success Metrics**: Flow runs cleanly with measurable outputs recorded.
  - **Testing**: Manual/demo runs documented.

- **Microphase 7.3**: Documentation & monitoring narratives.
  - **Status**: Pending ⚪
  - **Tasks**: Update README/Plan/docs with architecture notes, testing guidance, and demo steps; capture monitoring dashboards or runbooks that explain how to interpret telemetry.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: Phase 6 observability metrics and Phase 5 workflow documentation.
  - **Rollback Plan**: Publish partial docs with TODOs marked.
  - **Success Metrics**: Stakeholders can reproduce the demo and understand the test results/monitoring story from the docs.
  - **Testing**: Documentation reviews and sanity checks (links, steps, dashboards).

- **Microphase 7.4**: End-to-end testing.
  - **Status**: Pending ⚪
  - **Tasks**: Execute the full provision → diagnose → job → Kafka → auto-scaling workflow, automate the run if possible, and capture logs/metrics proving the flow.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: Phase 5 workflows and Phase 6 resilience controls.
  - **Rollback Plan**: Fall back to manual verification checklists with recorded outputs.
  - **Success Metrics**: Flow completes without errors and recorded output validates each stage.
  - **Testing**: The documented flow is repeatable with consistent outputs.

**Phase 7 Milestone**: Demo is reproducible, documented, and backed by automated QA checks.

## Holistic Gaps & Ideas
- **Relationship visibility**: The UI and API should clearly show which cluster owns each droplet; without that the demo cannot emphasize cluster-specific provisioning.
- **Diagnosis workflow**: Implement buttons should transition from insight to job creation; currently the page is read-only.
- **Kafka consumers**: As long as only the producer exists, downstream reactions (scaling/auto provisioning) cannot be shown.
- **Monitoring UX**: Metrics history lacks pagination/filters and does not highlight cluster selection.
- **Concurrency narrative**: Rate limiting, goroutines, and channels are not currently surfaced in docs or UI, which weakens the demo’s resilience story.
- **Rate limiter & concurrency**: Plan out shared rate limiter service and channel-based workers to reuse across job/action endpoints.
- **Additional improvements**: Look for missing health checks, logging, or auto-scaling heuristics while building Phase 6 workflows.

- **Current Status**: Phase 1–4 complete; Phase 5 event chain is in progress and Phases 6/7 are pending.
- **Feedback Loop**: After each microphase, test manually and note issues here. Iterate as needed.
- **Risks**: Docker complexity—mitigate with simple configs. LLM mocks—ensure they're realistic.
- **Timeline**: 1-2 weeks total, adjustable based on feedback.


## Current Implementation Status
### ✅ What's Already Implemented (Beyond Plan Phase 1)

#### Backend (Go/REST)
- Complete REST services: Hello, Provisioning, Diagnosis, Job, Monitoring
- All CRUD operations for droplets, jobs, metrics
- Mock diagnosis with AI-like responses
- Kafka producer for events
- Clean architecture with models, interfaces, services, repositories

#### Frontend (React/TypeScript)
- Complete UI components for all features: Dashboard, Provisioning, Diagnosis, Jobs, Monitoring
- REST integration working
- Responsive design with Tailwind CSS
- Form handling and state management
- Clean component architecture

#### Infrastructure
- Docker Compose with MySQL, Redis, Kafka, Zookeeper
- REST API gateway setup
- Hot reload with Air for Go development

### ❌ Critical Gaps (What Needs Work)
1. **Database Integration (HIGH PRIORITY)**
  - Issue: All repositories use in-memory maps instead of real databases
  - Impact: Data doesn't persist, no real database operations
  - Status: database directory is empty - no schemas, migrations, or init scripts

2. **Kafka Event Processing (HIGH PRIORITY)**
  - Issue: Only producer exists, no consumers for event-driven processing
  - Impact: Events are published but not consumed/processed
  - Missing: Consumer services, event handlers for scaling/jobs/logs

3. **Real LLM Integration (MEDIUM PRIORITY)**
  - Issue: Diagnosis service returns mock responses
  - Impact: No actual AI analysis of cluster data
  - Missing: OpenAI API integration, real prompt engineering

4. **Testing Infrastructure (MEDIUM PRIORITY)**
  - Issue: No tests implemented ("test": "echo 'No tests yet'")
  - Impact: No quality assurance, hard to refactor safely
  - Missing: Unit tests, integration tests, e2e tests

5. **Health Checks & Monitoring (MEDIUM PRIORITY)**
  - Issue: No synthetic health checks implemented
  - Impact: Missing core feature from requirements
  - Missing: Health check endpoints, monitoring logic

6. **Auto-Scaling Logic (MEDIUM PRIORITY)**
  - Issue: No automatic scaling based on metrics
  - Impact: Manual scaling only
  - Missing: Scaling triggers, threshold logic

7. **Logging & Observability (LOW PRIORITY)**
  - Issue: Basic logging, no structured logging or log streaming
  - Impact: Hard to debug production issues
  - Missing: Structured logging, log aggregation, streaming UI

## Updated Development Plan
- **Phase 2A: Database Integration (URGENT)**
  - Create MySQL schemas for droplets, jobs, metrics, clusters
  - Implement real repository connections (replace in-memory with SQL)
  - Add Redis caching for performance
  - Create database migrations and init scripts

- **Phase 2B: Event Processing (URGENT)**
  - Implement Kafka consumers for cluster events
  - Add event handlers for scaling triggers
  - Connect job processing to event system
  - Add activity logging via events

- **Phase 3: Core Features Completion**
  - Integrate real LLM API for diagnosis
  - Implement synthetic health checks
  - Add auto-scaling logic
  - Complete all 6 feature requirements

- **Phase 4: Quality & Production**
  - Add comprehensive testing
  - Implement proper error handling & logging
  - Add authentication/authorization
  - Performance optimization

- **Phase 5: Demo & Polish**
  - Create 15-20 min demo script
  - Add documentation and monitoring
  - Final UI/UX polish

## Immediate Next Steps
- Fix Database Layer - This is blocking real functionality
- Implement Kafka Consumers - Events are core to the architecture
- Add Tests - Essential for maintaining quality
- Connect Real LLM - Makes diagnosis feature actually work

The codebase is much more advanced than the plan indicates - you have a solid foundation with all major components implemented. The main work now is connecting real infrastructure (databases, Kafka, LLMs) and adding tests/monitoring.