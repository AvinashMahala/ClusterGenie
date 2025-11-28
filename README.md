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

## Prerequisites

- Docker & Docker Compose (for services).
- Go 1.21+ (for backend development).
- Node.js 18+ & Yarn (for frontend).
- Git (for cloning).

## Installation & Setup

1. Clone the repo: `git clone https://github.com/AvinashMahala/ClusterGenie.git && cd ClusterGenie`.
2. Run the one-command setup: `./setup.sh` (or `python setup.py` if using Python script).
   - Checks prerequisites.
   - Installs dependencies (Go modules, Yarn packages).
   - Builds Docker images.
   - Starts services via Docker Compose.
3. Run `./start.sh` to initiate and start backend/frontend in separate terminals.
4. Access the app: Open browser to `http://localhost:3000`. Backend REST API at `localhost:8080`.
5. To stop: Run `./stop.sh` in any terminal.

For manual setup:
- Backend: `cd backend && go mod tidy && docker-compose up`.
- Frontend: `cd frontend && yarn install && yarn dev`.

## Usage

- **Demo Flow**: Provision a droplet → Trigger diagnosis → View scaling/logs → Run health checks.
- **API Docs**: Visit `http://localhost:8080/swagger/index.html` for Swagger UI.
- **Logs**: Check Docker logs: `docker-compose logs`.

## Development

- **Backend**: Each service in `backend/` has its own `main.go`. Use `go run` for local dev.
- **Frontend**: `yarn dev` in `frontend/`. Hot-reload enabled.
- **Testing**: Run `make test` (unit tests) or `docker-compose exec <service> go test`.
- **Debugging**: Use VS Code debugger for Go/React. Logs via `docker-compose logs`.

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

## Troubleshooting

- **Docker Issues**: If `docker-compose up` fails, check ports (e.g., 3306 for MySQL). Run `docker system prune` to clean up.
- **REST Errors**: Check logs for Gin errors; ensure services are running (`docker ps`).
- **Frontend Not Loading**: Check Node.js version; clear npm cache (`npm cache clean --force`).
- **Go Mod Errors**: Run `go mod tidy` in `backend/`.
- **Kafka Not Connecting**: Wait for Zookeeper; check logs with `docker-compose logs kafka`.

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