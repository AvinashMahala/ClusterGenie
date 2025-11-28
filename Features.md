# ClusterGenie Features

This document lists the core features targeted for ClusterGenie. Each feature is designed to demonstrate skills from the DigitalOcean Senior Software Engineer (Copilots) JD, such as gRPC APIs, microservices, LLMs, and operational excellence. Features are prioritized for MVP/demo flow.

## Core Features

### 1. Diagnose Requests
- **Description**: Trigger AI-assisted analysis of cluster logs to detect issues and suggest fixes (e.g., "High CPU detected—recommend scaling").
- **Backend**: Diagnosis Service with mocked LLM logic; fetches logs from MySQL/Redis.
- **Frontend**: Button to initiate; displays insights in a panel.
- **Tech Tie-In**: LLMs for agentic solutions; gRPC for requests.
- **Priority**: High (JD focus on AI agents).
- **User Story**: As a cluster admin, I want to diagnose issues so that I can fix problems quickly.
- **Acceptance Criteria**: User clicks button, sees AI insights within 5 seconds; insights include suggestions.
- **Mock Details**: Uses rule-based logic (e.g., keyword matching) instead of real LLM API.
- **Dependencies**: Relies on Activity Logs for data.
- **Demo Script**: "Click 'Diagnose'—watch AI suggest scaling based on simulated logs."

### 2. Droplet Provisioning
- **Description**: Simulate creating/managing virtual machines ("droplets") with status tracking.
- **Backend**: Provisioning Service; saves to MySQL, publishes Kafka events.
- **Frontend**: Form for provisioning; list view with statuses.
- **Tech Tie-In**: Microservices, Kafka events.
- **Priority**: High (core infrastructure ops).
- **User Story**: As an ops engineer, I want to provision droplets so that I can scale infrastructure.
- **Acceptance Criteria**: Form submits, droplet appears in list with "provisioning" status; updates to "active".
- **Mock Details**: No real VMs; simulates with in-memory/DB states.
- **Dependencies**: None (standalone).
- **Demo Script**: "Fill form, submit—see droplet provisioned and listed."

### 3. Scaling Actions
- **Description**: Auto-scale droplets based on metrics (e.g., CPU > 80% triggers scale-up).
- **Backend**: Monitors metrics via Redis; scales via Provisioning Service; events via Kafka.
- **Frontend**: Real-time visualization of scaling events.
- **Tech Tie-In**: Distributed systems, automation.
- **Priority**: High (workload performance).
- **User Story**: As a system admin, I want auto-scaling so that performance is maintained.
- **Acceptance Criteria**: Metrics exceed threshold, scaling event triggers; UI updates in real-time.
- **Mock Details**: Simulated metrics; no real scaling.
- **Dependencies**: Droplet Provisioning for targets.
- **Demo Script**: "Trigger high CPU—watch auto-scale and event log."

### 4. Worker Job Progress
- **Description**: Background job processing (e.g., for provisioning tasks) with progress tracking.
- **Backend**: Kafka queues jobs; workers update status in Redis.
- **Frontend**: Progress bars with real-time updates (polling/WebSocket).
- **Tech Tie-In**: Async processing, Kafka.
- **Priority**: Medium (operational tasks).
- **User Story**: As an engineer, I want to track jobs so that I know when tasks complete.
- **Acceptance Criteria**: Job starts, progress bar updates; completes with success/fail.
- **Mock Details**: Simulated jobs; no real background work.
- **Dependencies**: Kafka for queuing.
- **Demo Script**: "Start job—monitor progress bar to completion."

### 5. Synthetic Health Checks
- **Description**: Run simulated checks on cluster components (e.g., ping services); display pass/fail.
- **Backend**: Monitoring Service performs checks; stores results in MySQL.
- **Frontend**: Dashboard with indicators; manual trigger.
- **Tech Tie-In**: QA tooling, reliability.
- **Priority**: Medium (system reliability).
- **User Story**: As a devops lead, I want health checks so that I can monitor system health.
- **Acceptance Criteria**: Trigger check, see pass/fail indicators; results persist.
- **Mock Details**: Random/simulated outcomes.
- **Dependencies**: None.
- **Demo Script**: "Run check—view green/red dashboard."

### 6. Activity Logs
- **Description**: Stream and filter logs from all operations for auditing/troubleshooting.
- **Backend**: Kafka events logged to MySQL; gRPC streaming.
- **Frontend**: Scrollable log viewer with search.
- **Tech Tie-In**: Logging, event sourcing.
- **Priority**: Medium (operational excellence).
- **User Story**: As a support engineer, I want logs so that I can debug issues.
- **Acceptance Criteria**: Logs stream in real-time; filter by type works.
- **Mock Details**: Generated sample logs.
- **Dependencies**: Kafka for events.
- **Demo Script**: "View logs—filter by 'provision' to see events."

## Feature Scope & Constraints
- **MVP Focus**: Basic implementations for all features in Phase 1-3; full polish in Phase 4-5.
- **Simulations**: All features use mocks/simulations (no real cloud APIs) for demo simplicity.
- **Demo Flow**: Provision → Diagnose → Scale → Monitor (jobs/health/logs).
- **Extensibility**: Features designed with interfaces for easy addition (e.g., more diagnostics).

## Alignment with JD
- **gRPC/Go**: All backend features expose gRPC APIs.
- **Microservices**: Features distributed across services.
- **AI/LLMs**: Diagnostics demonstrate agentic solutions.
- **Distributed Tech**: MySQL/Redis/Kafka integrated.
- **Ops Excellence**: Health checks, logs, automation.

This list will be referenced during development. Updates as needed.