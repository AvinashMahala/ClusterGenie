# ClusterGenie

## Table of Contents
- [Overview](#overview)
- [Key Principles & Standards](#key-principles--standards)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Development](#development)
- [Contributing](#contributing)
- [Phases & Updates](#phases--updates)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Demo Outline](#demo-outline)
- [License](#license)
- [Additional Ideas](#additional-ideas)

## Overview

**ClusterGenie** is a fullstack demo project designed for a DigitalOcean Senior Software Engineer (Copilots) interview. It showcases a scalable, AI-assisted cluster management dashboard inspired by cloud infrastructure operations. The application allows users to diagnose cluster health, provision droplets (virtual machines), manage scaling actions, monitor worker job progress, perform synthetic health checks, and view activity logs—all with a focus on operational excellence, automation, and AI-driven insights.

This project demonstrates key skills from the job description, including:
- Developing REST APIs in Go for microservices.
- Building distributed systems with MySQL, Redis, and Kafka.
- Integrating Large Language Models (LLMs) for agentic solutions (e.g., diagnostics).
- Collaborating on product features with clean architecture.
- Ensuring reliability through health checks, logging, and QA tooling.

The demo is structured for a 15-20 minute presentation: overview the UI, demonstrate features, explain architecture, and handle Q&A. It's built with industrial best practices (SOLID principles, OOP, design patterns) while keeping code simple, modular, and easy to understand/debug/scale.

### Key Principles & Standards
- **SOLID Principles**: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion—ensuring maintainable, extensible code.
- **OOP & Design Patterns**: Use of interfaces, repositories, services, and patterns like Dependency Injection (DI), Factory, and Observer (for events).
- **Separation of Concerns**: Clear layers (models, interfaces, services, repositories) in both backend and frontend.
- **Simplicity & Scalability**: Code is readable, with incremental scaling (e.g., add services via Docker). Easy debugging via structured logging and error handling.
- **Industry Best Practices**: Version control (Git), containerization (Docker), orchestration (Docker Compose), testing (unit/integration), documentation (Swagger), and CI/CD readiness.

## Features

1. **Diagnose Requests**: AI-powered analysis of cluster logs using LLMs (e.g., OpenAI) to detect issues and suggest fixes (e.g., "High CPU—recommend scaling").
2. **Droplet Provisioning**: Simulate creating/managing virtual machines with forms and status tracking.
3. **Scaling Actions**: Automated scaling based on metrics (e.g., CPU thresholds), visualized in real-time.
4. **Worker Job Progress**: Background job processing with progress bars and real-time updates.
5. **Synthetic Health Checks**: Run simulated checks on cluster components, displayed as pass/fail dashboards.
6. **Activity Logs**: Stream and filter logs from all operations for auditing and troubleshooting.

## Architecture

ClusterGenie follows a microservices architecture with clean layers for scalability and maintainability. The backend uses Go for REST services, while the frontend is a React SPA. Communication is handled via HTTP/JSON (sync), Kafka (async events), and Axios (frontend-backend).

### Text-Based Architecture Diagram

```
+-------------------+     +-------------------+     +-------------------+
|   Frontend        |     |   Backend         |     |   Database        |
|   (React/TS)      |     |   (Go Microservices)|   |   (MySQL/Redis)   |
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
| - Models          |     | - Models          |     | - Schemas         |
| - Interfaces      |     | - Interfaces      |     | - Migrations      |
| - Services        |     | - Services        |     | - Init Scripts    |
| - Repositories    |     | - Repositories    |     |                   |
| - Components      |     | - REST Handlers   |     |                   |
| - UI (Tailwind)   |     | - Kafka Consumers |     |                   |
+-------------------+     +-------------------+     +-------------------+
          |                           |                           |
          | Axios/HTTP               | HTTP/JSON/Kafka           | SQL/Cache
          |                           |                           |
          v                           v                           v
+-------------------+     +-------------------+     +-------------------+
|   User Browser    | <-- |   Core API        | <-- |   MySQL           |
|                   |     |   Service         |     |   (Persistent)    |
+-------------------+     +-------------------+     +-------------------+
                              |           |
                              | Kafka     | HTTP/JSON
                              |           |
                              v           v
+-------------------+     +-------------------+     +-------------------+
| Diagnosis Service |     | Provisioning      |     | Redis            |
| (LLM Integration) |     | Service           |     | (Cache)          |
+-------------------+     +-------------------+     +-------------------+
                              |           |
                              | Kafka     | HTTP/JSON
                              |           |
                              v           v
+-------------------+     +-------------------+     +-------------------+
| Monitoring Service|     | Kafka/Zookeeper  |     | Activity Logs     |
| (Health/Logs)     |     | (Events)         |     | (Streaming)       |
+-------------------+     +-------------------+     +-------------------+
```

- **Frontend**: React SPA with layered architecture (models → interfaces → services → repositories → components). Communicates with backend via Axios/HTTP.
- **Backend**: 4 microservices (Core API, Diagnosis, Provisioning, Monitoring) with shared layers. Uses DI for loose coupling.
- **Database**: MySQL for persistence, Redis for caching, Kafka for events. Schemas and migrations in `database/`.
- **Communication**: HTTP/JSON for service calls, Kafka for async events (e.g., scaling triggers log updates), Axios for frontend.

## Tech Stack

- **Backend**: Go 1.21+, Gin, Swagger, MySQL, Redis, Kafka, Mocked LLM logic (pluggable for real APIs).
- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, SASS, Axios.
- **Infrastructure**: Docker, Docker Compose, Makefile.
- **Other**: Git, GitHub Actions (CI/CD), Prometheus (optional monitoring).
- **Other**: Git, GitHub Actions (CI/CD), Prometheus (optional monitoring).

## Prerequisites

- Docker & Docker Compose (for services).
- Go 1.21+ (for backend development).
- Node.js 18+ & Yarn (for frontend).
- Git (for cloning).

## Installation & Setup

1. Clone the repo: `git clone https://github.com/AvinashMahala/ClusterGenie.git && cd ClusterGenie`.
2. Run the one-command setup (macOS / Docker): `./setup.sh`.
   - This script ensures Docker is running, starts MySQL and initializes the database schema (from `database/init.sql`) if needed.
   - It does NOT install system-level prerequisites (Homebrew, Docker) — use `./start.sh` for the full interactive installer on macOS.
3. **For Development**: Run `./dev.sh` for a macOS-friendly hot-reloading development environment.
   - `dev.sh` starts infrastructure (MySQL, Redis, Kafka, Zookeeper) in Docker, initializes DB/schema + sample data if missing, and launches backend (Air) + frontend (Vite) in new Terminal tabs.
   - Note: `dev.sh` uses macOS Terminal scripting (osascript) and assumes a macOS environment; on Linux/Windows run the manual commands instead (see below).
4. **For Production-like Testing**: Run `./start.sh` to start the full environment and helper monitor terminals (macOS). `start.sh` is macOS-oriented — it attempts to install missing prerequisites (Homebrew, Xcode CLI, Docker Desktop, Node, Go, Air, Swag) and opens a set of Terminal tabs for logs.
5. Access the app (local defaults):

- Frontend (Vite dev server): http://localhost:5173
- Backend REST API: http://localhost:8080
- Swagger / API Docs: http://localhost:8080/swagger/index.html

Docker services and observability ports:
- MySQL: 3306
- Redis: 6379
- Kafka: 9092
- Prometheus: 9090
- Prometheus: 9090 (by default development config scrapes host.docker.internal:8080 so Prometheus can collect metrics from a locally-running backend)
- Grafana: 3001 (see note below)

Note about core-api host port (COREAPI_PORT)
-------------------------------------------
The `core-api` container exposes port 8080 inside the container. When running via `docker-compose` we map a host port to container port 8080 so you can reach the API at http://localhost:<host-port>. The host port defaults to 8080, but if that port is in use on your machine you can override it using the environment variable `COREAPI_PORT`. Example `.env.example` with recommended defaults is provided at the repo root.

Examples:

```bash
# start core-api mapped to an alternate host port (e.g. 8081):
COREAPI_PORT=8081 docker-compose up core-api

# Or set in shell / .env before running dev.sh so the dev script will honor it:
export COREAPI_PORT=8081
./dev.sh -d
```

Helpful defaults / credentials:

- MySQL root user: username `root` / password `rootpassword` (docker-compose sets this)
- Default database name: `clustergenie` (initial schema is in `database/init.sql`, seed data in `database/seed.sql`). Prefer using the versioned migrations in `database/migrations/` for schema changes — these are used for CI and are reversible.
6. To stop: Run `./stop.sh` in any terminal or press Ctrl+C in the development terminal.

### Development Workflow
- **Daily Development**: Use `./dev.sh` - hot reloading for both backend and frontend
- **Production Testing**: Use `./start.sh` - full Docker environment
- **Manual Development**: See Development section below

For manual (cross-platform) setup and development (alternative to `dev.sh` / `start.sh`):

- Infrastructure (docker-compose):
   - Start core infra: `docker-compose up -d mysql redis kafka zookeeper`
   - Optional observability: `docker-compose up -d prometheus grafana` (Grafana runs on 3001 in this repo)

- Backend (local dev):
   - cd backend && go mod tidy
   - run with hot reload if you have Air: `air`  OR run locally: `go run ./...`

- Frontend (local dev):
   - cd frontend && yarn install
   - yarn dev (Vite dev server, default port 3000 in this project)

## Usage

- **Demo Flow**: Provision a droplet → Trigger diagnosis → View scaling/logs → Run health checks.
- **API Docs**: Visit `http://localhost:8080/swagger/index.html` for Swagger UI.
- **Logs**: Check Docker logs: `docker-compose logs`.

## Development

### Quick Start for Development
```bash
# One-time setup (installs Go, Node, Air, etc.)
./start.sh

# Daily development with hot reloading
./dev.sh
```

### Manual Development Setup
- **Backend**: Run `cd backend && air` for hot reloading with Air
- **Frontend**: Run `cd frontend && yarn dev` for hot reloading with Vite
- **Infrastructure**: Run `docker-compose up -d mysql redis kafka zookeeper`

### Development Features
- **Hot Reloading**: Both backend (Go) and frontend (React) support hot reloading
- **Automatic Rebuild**: Backend rebuilds automatically on Go file changes
- **Live Browser Refresh**: Frontend updates automatically in browser
- **Database Persistence**: MySQL/Redis data persists across restarts

### Testing
- **Unit Tests**: Run `make test` or `docker-compose exec <service> go test`
- **Integration Tests**: Use the running development environment

E2E / Playwright test notes:
- The Playwright E2E suite (e2e/playwright) may assume a Vite dev server default at port 5173 in its documentation. This repository configures Vite to run on port 3000 — if your frontend is running on port 3000, export the base URL before running tests:

```bash
export E2E_BASE_URL='http://localhost:5173'
```

Then run the e2e tests from the e2e/playwright folder.

### Debugging
- **Backend**: Use VS Code Go debugger or `dlv` debugger
- **Frontend**: Use browser dev tools or VS Code React debugger
- **Logs**: Check `backend-dev.log` and `frontend-dev.log` for development logs

## Contributing

1. Fork and clone.
2. Run `./setup.sh`.
3. Create a branch: `git checkout -b feature/your-feature`.
4. Follow SOLID/OOP: Add interfaces, use DI.
5. Test: `make test`.
6. PR with description.

**Code Style**: Use `gofmt` for Go, ESLint for JS/TS. Follow naming conventions (e.g., PascalCase for models).

## Phases & Updates

- **Phase 1 (In Progress)**: Project setup, README, directory structure.
- **Phase 2**: Backend core (models, interfaces, services, repositories).
- **Phase 3**: Frontend core (components, REST integration).
- **Phase 4**: Integration (Kafka, LLM, full features).
- **Phase 5**: Polish (tests, docs, demo script).

This README will be updated after each phase.

### Prometheus / Observability


### Prometheus + Grafana (local)

We include a lightweight Prometheus + Grafana stack in `docker-compose.yml`. To start them along with the app:

```bash
docker-compose up -d prometheus grafana
```

- Prometheus UI: http://localhost:9090
- Grafana UI: http://localhost:3001 (default admin/admin on first boot)

Grafana is pre-provisioned with a sample dashboard located at `monitoring/grafana/dashboards/clustergenie_dashboard.json` that visualizes worker queue length, active workers, and rate-limit tokens.
There is also a minimal dashboard for playback/demo at `monitoring/grafana/dashboards/clustergenie_minimal_dashboard.json` and a short demo README at `monitoring/demo/README.md` showing quick steps to simulate load and visualize behaviors.

### Embedded dashboard preview in UI

You can embed the prebuilt Grafana dashboard inside the Monitoring panel. Click "Embed Grafana Panel" in the Monitoring view (requires Grafana running locally at http://localhost:3001). The embedded iframe will pass the chosen cluster or user as a template variable to the dashboard so you can preview scoped metrics in the UI.

### Persisted per-client rate limits (Redis)

You can manage per-client or per-cluster rate limit rules via the API (persisted in Redis):

- POST /api/v1/observability/ratelimit/config
   - body: { name, scope_type: "user"|"cluster"|"global", scope_id, refill_rate, capacity }
- GET /api/v1/observability/ratelimit/config?name=<name>&scope_type=<user|cluster|global>&scope_id=<id>
 - GET /api/v1/observability/ratelimit/config/list?name=<optional>&scope_type=<user|cluster|global>&scope_id=<id> — list persisted limiter configs
 - DELETE /api/v1/observability/ratelimit/config — delete a persisted rule, accepts JSON body with one of { key, name + scope_type + scope_id }

These endpoints store limiter rules in Redis keys like `limiter_config:<name>:user:<id>` so multiple instances of the service pick up the same limits.

### Configurable Environment Variables (backend/core-api)

- CLUSTERGENIE_DIAG_RATE — token refill rate (tokens/sec) for diagnosis limiter (default 0.2)
- CLUSTERGENIE_DIAG_CAP — bucket capacity for diagnosis limiter (default 5)
- CLUSTERGENIE_JOBS_RATE — token refill rate for job creation limiter (default 0.1)
- CLUSTERGENIE_JOBS_CAP — bucket capacity for job creation limiter (default 3)
- CLUSTERGENIE_DIAG_SCOPE — limiter scope for diagnosis: "cluster" | "user" | "global" (default cluster)
- CLUSTERGENIE_JOBS_SCOPE — limiter scope for jobs: "user" | "cluster" | "global" (default user)
- CLUSTERGENIE_WORKER_COUNT — number of workers in job worker pool (default 4)
- CLUSTERGENIE_WORKER_QUEUE — job queue size (default 100)

Additional runtime configuration used by `core-api` (when running via Docker Compose or local .env):
- MYSQL_USER, MYSQL_PASSWORD, MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE — MySQL connection (defaults: root/rootpassword/mysql/3306/clustergenie)
- REDIS_ADDR — redis host:port (default: localhost:6379)
- KAFKA_BROKERS — comma-separated Kafka broker addresses (default: localhost:9092)
- API_PORT — port the core-api binds to (default: 8080)

The frontend optionally visualizes worker-queue details and rate-limit status under the Monitoring panel.

### Local .env for backend/core-api

- Place a `.env` file in `backend/core-api/.env` to override the default settings during development. The application uses `github.com/joho/godotenv` to load this file automatically on startup if present.
- An example is included at `backend/core-api/.env.example` — copy it to `.env` and tweak values to tune rate limits and worker pool for local testing.

## Troubleshooting

- **Docker Issues**: If `docker-compose up` fails, check ports (e.g., 3306 for MySQL). Run `docker system prune` to clean up.
- **REST Errors**: Check logs for Gin errors; ensure services are running (`docker ps`).
- **Frontend Not Loading**: Check Node.js version; clear npm cache (`npm cache clean --force`).
- **Go Mod Errors**: Run `go mod tidy` in `backend/`.
- **Kafka Not Connecting**: Wait for Zookeeper; check logs with `docker-compose logs kafka`.

Known quirks / developer notes:
- The repo's Docker Compose maps Grafana to port **3001** (see `docker-compose.yml`) but some local README/docs and the frontend `MonitoringPanel` component may reference `http://localhost:3000` or `http://localhost:3001` for embedded Grafana links. If you see an "unable to load" dashboard in the UI, either:
   - Run Grafana on port 3000 instead (adjust docker-compose mapping) or
   - Update `frontend/src/components/MonitoringPanel.tsx` to point to `http://localhost:3001` when running the full stack locally.

The repo's Docker Compose maps Grafana to port **3001** (see `docker-compose.yml`). The frontend now supports configuring Grafana and API endpoints via Vite environment variables:

- VITE_API_URL — base URL for backend API (default: http://localhost:8080)
   - VITE_GRAFANA_URL — base URL for Grafana embeds and links (default: http://localhost:3001 for local dev; when running full docker-compose you may want to set this to http://localhost:3001 or http://grafana:3001)

If you see an "unable to load" dashboard in the UI adjust `VITE_GRAFANA_URL` to point at the correct Grafana address for your environment.

## Roadmap

- See `Plan.md` for detailed phases/microphases.
- See `Features.md` for feature specs.
- See `Brainstorming.md` for directory structures and design decisions.

## Demo Outline

1. **Intro (2 min)**: Overview of ClusterGenie and architecture.
2. **Setup (1 min)**: Run `./setup.sh`; show services starting.
3. **Features Demo (10 min)**: Provision droplet → Diagnose → Scale → Monitor jobs/health/logs.
4. **Code Walkthrough (4 min)**: Explain layers, REST API, Kafka.
5. **Q&A (3 min)**: Handle questions.

## License

MIT License. See LICENSE for details.

## Additional Ideas

- **CHANGELOG.md**: Track changes per phase.
- **API Docs**: Auto-generated from REST in `docs/`.
- **Performance**: Add benchmarks for scaling demos.
- **Security**: Input validation, rate limiting.
- **Extensibility**: Plugin system for new diagnostics.
- **CI/CD**: GitHub Actions for automated builds/tests.