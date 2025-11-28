# ClusterGenie Development Plan

This document outlines the phased, incremental development plan for ClusterGenie. We start with a minimal MVP (basic structure and "Hello World" functionality) and build up to a fully functional, demo-ready product. Each **Phase** is broken into **Microphases** (small, testable steps). After each microphase/phase, perform manual testing and provide feedback for iteration.

Progress will be tracked here—update after each completion.

## Overall Milestones
- **MVP Milestone (End of Phase 1)**: Basic project structure, Docker setup, and simple backend/frontend "Hello World" running locally.
- **Core Functionality Milestone (End of Phase 2)**: Backend services with basic CRUD, models, and interfaces; frontend with UI skeleton.
- **Integrated Features Milestone (End of Phase 3)**: Frontend connected to backend via gRPC; all 6 features prototyped.
- **Full Integration Milestone (End of Phase 4)**: Kafka events, LLM mocks, health checks, and end-to-end flows working.
- **Demo-Ready Milestone (End of Phase 5)**: Polished app with tests, docs, and 15-20 min demo script.

## Assumptions & Constraints
- LLMs are mocked (no real API keys needed).
- No real cloud APIs; all simulations.
- Focus on macOS/Linux; Docker for portability.
- Incremental testing: Manual feedback after each microphase.

## Phase 1: Project Setup (MVP Foundation)
**Goal**: Establish project structure, tooling, and basic runnable app.

- **Microphase 1.1**: Create directory structure (`backend/`, `frontend/`, `database/`) and root files (`.gitignore`, `Makefile`, `docker-compose.yml`, `setup.sh`).
  - **Tasks**: Scaffold directories; add basic Docker Compose for MySQL/Redis/Kafka; create setup.sh skeleton.
  - **Estimated Time**: 1-2 hours.
  - **Dependencies**: None.
  - **Rollback Plan**: Delete directories if setup fails.
  - **Success Metrics**: Directories exist; Docker Compose validates without errors.
  - **Testing**: Run `./setup.sh` to verify directories and basic Docker startup.

- **Microphase 1.2**: Set up backend MVP (Go module, basic gRPC server).
  - **Tasks**: Create `backend/go.mod`; add shared proto files; build Core API service with "Hello" gRPC endpoint.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 1.1 completed.
  - **Rollback Plan**: Remove backend/ if Go mod fails.
  - **Success Metrics**: Go service compiles; gRPC endpoint responds.
  - **Testing**: Run backend service via Docker; test gRPC call.

- **Microphase 1.3**: Set up frontend MVP (React app, basic UI).
  - **Tasks**: Create `frontend/` with Vite/React/TS; add simple component displaying "Hello from ClusterGenie".
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: None (parallel to 1.2).
  - **Rollback Plan**: Delete frontend/ if npm fails.
  - **Success Metrics**: App builds; UI loads in browser.
  - **Testing**: Run `npm run dev`; verify UI loads.

- **Microphase 1.4**: Integrate MVP (frontend calls backend).
  - **Tasks**: Add gRPC-Web to frontend; connect to backend "Hello" endpoint.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 1.2 and 1.3 completed.
  - **Rollback Plan**: Revert gRPC-Web if connection fails.
  - **Success Metrics**: Frontend displays backend response.
  - **Testing**: Full stack runs; UI shows backend response.

**Phase 1 Milestone**: MVP app running locally with basic hello-world functionality.

## Phase 2: Backend Core (Models, Services, Repositories)
**Goal**: Implement backend architecture layers for all services.

- **Microphase 2.1**: Define shared models and interfaces.
  - **Tasks**: Create `backend/models/` (e.g., Droplet, Job); `backend/interfaces/` (e.g., Repository interfaces).
  - **Estimated Time**: 2 hours.
  - **Dependencies**: Phase 1.
  - **Rollback Plan**: Remove models/ if conflicts.
  - **Success Metrics**: Models compile; interfaces defined.
  - **Testing**: Unit tests for models.

- **Microphase 2.2**: Implement repositories (MySQL/Redis).
  - **Tasks**: Add `backend/repositories/` with MySQLRepo, RedisRepo; connect to DBs in Docker.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: 2.1.
  - **Rollback Plan**: Revert DB connections if queries fail.
  - **Success Metrics**: CRUD operations succeed.
  - **Testing**: CRUD operations via unit tests.

- **Microphase 2.3**: Build services (business logic).
  - **Tasks**: Add `backend/services/` for each service (e.g., ProvisioningService); use DI.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: 2.2.
  - **Rollback Plan**: Simplify services if DI issues.
  - **Success Metrics**: Services inject dependencies correctly.
  - **Testing**: Service methods with mocks.

- **Microphase 2.4**: Complete gRPC APIs for all services.
  - **Tasks**: Implement handlers for diagnose, provision, scale, jobs, health, logs.
  - **Estimated Time**: 4-5 hours.
  - **Dependencies**: 2.3.
  - **Rollback Plan**: Start with one service if all fail.
  - **Success Metrics**: All endpoints respond.
  - **Testing**: gRPC calls to all endpoints.

**Phase 2 Milestone**: Backend fully layered, with all APIs responding (mock data).

## Phase 3: Frontend Core (Components, Integration)
**Goal**: Build UI components and connect to backend.

- **Microphase 3.1**: Define frontend models/interfaces.
  - **Tasks**: Create `frontend/src/models/`, `interfaces/` mirroring backend.
  - **Estimated Time**: 1-2 hours.
  - **Dependencies**: Phase 2.
  - **Rollback Plan**: Remove if TS errors.
  - **Success Metrics**: Types compile.
  - **Testing**: Type checks.

- **Microphase 3.2**: Implement repositories and services.
  - **Tasks**: Add `frontend/src/repositories/` (gRPC clients); `services/` with business logic.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 3.1.
  - **Rollback Plan**: Use REST if gRPC-Web fails.
  - **Success Metrics**: API calls succeed.
  - **Testing**: Frontend API calls.

- **Microphase 3.3**: Build UI components.
  - **Tasks**: Create components for each feature (e.g., DiagnosePanel); style with Tailwind.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: 3.2.
  - **Rollback Plan**: Simplify components.
  - **Success Metrics**: Components render.
  - **Testing**: Component rendering.

- **Microphase 3.4**: Integrate full UI.
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
  - **Tasks**: Add producers/consumers for scaling/jobs/logs.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: Phase 3.
  - **Rollback Plan**: Skip async if Kafka fails.
  - **Success Metrics**: Events publish/consume.
  - **Testing**: Event publishing/consuming.

- **Microphase 4.2**: Add LLM mocks for diagnostics.
  - **Tasks**: Mock AI responses in Diagnosis Service.
  - **Estimated Time**: 2 hours.
  - **Dependencies**: 4.1.
  - **Rollback Plan**: Use static responses.
  - **Success Metrics**: Diagnose returns insights.
  - **Testing**: Diagnose requests return insights.

- **Microphase 4.3**: Implement remaining features (scaling, health, logs).
  - **Tasks**: Add logic for auto-scaling, synthetic checks, log streaming.
  - **Estimated Time**: 4-5 hours.
  - **Dependencies**: 4.2.
  - **Rollback Plan**: Implement one feature at a time.
  - **Success Metrics**: All features functional.
  - **Testing**: All features working.

- **Microphase 4.4**: End-to-end testing.
  - **Tasks**: Full flows (provision → diagnose → scale).
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 4.3.
  - **Rollback Plan**: Debug flows individually.
  - **Success Metrics**: Flows complete without errors.
  - **Testing**: Manual demo runs.

**Phase 4 Milestone**: All features integrated and functional.

## Phase 5: Polish & Demo (Tests, Docs, Optimization)
**Goal**: Refine for production/demo readiness.

- **Microphase 5.1**: Add testing and QA.
  - **Tasks**: Unit/integration tests; grpc-gateway for Swagger.
  - **Estimated Time**: 3-4 hours.
  - **Dependencies**: Phase 4.
  - **Rollback Plan**: Skip advanced tests.
  - **Success Metrics**: Test suites pass.
  - **Testing**: Test suites pass.

- **Microphase 5.2**: Documentation and monitoring.
  - **Tasks**: Update README; add health checks; integrate logging.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 5.1.
  - **Rollback Plan**: Revert docs.
  - **Success Metrics**: Docs accessible.
  - **Testing**: Docs accessible.

- **Microphase 5.3**: Performance and security.
  - **Tasks**: Optimize queries; add validation.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 5.2.
  - **Rollback Plan**: Simplify optimizations.
  - **Success Metrics**: App performs well.
  - **Testing**: Load tests.

- **Microphase 5.4**: Demo preparation.
  - **Tasks**: Create demo script; polish UI.
  - **Estimated Time**: 2-3 hours.
  - **Dependencies**: 5.3.
  - **Rollback Plan**: Use basic script.
  - **Success Metrics**: Demo runs smoothly.
  - **Testing**: 15-20 min demo.

**Phase 5 Milestone**: Product ready for interview demo.

## Tracking & Feedback
- **Current Status**: Completed Phase 1, Microphase 1.3. Starting Microphase 1.4.
- **Feedback Loop**: After each microphase, test manually and note issues here. Iterate as needed.
- **Risks**: Docker complexity—mitigate with simple configs. LLM mocks—ensure they're realistic.
- **Timeline**: 1-2 weeks total, adjustable based on feedback.