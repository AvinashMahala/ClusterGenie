# REST Migration Plan

This document outlines a comprehensive step-by-step plan to migrate the ClusterGenie project from its current gRPC-based architecture to a REST-based API implementation. The migration aims to eliminate all gRPC dependencies while preserving existing functionality.

## Overview
- **Current State**: Go backend with gRPC services, TypeScript/React frontend with gRPC-Web clients.
- **Target State**: Go backend with REST API endpoints, TypeScript/React frontend with HTTP clients (e.g., Axios).
- **Key Changes**: Replace protobuf/gRPC with JSON/HTTP, update handlers, clients, and configurations.
- **Timeline Estimate**: 5-7 days for a small team.
- **Risks**: Data compatibility, performance impacts, potential breaking changes.
- **Status**: Phase 4 Completed (REST handlers implemented, Swagger updated, docker-compose modified; side-by-side testing ready).

## Phase 1: Preparation and Planning
### Microphase 1.1: Environment Setup
- Install REST framework for Go (e.g., Gin: `go get github.com/gin-gonic/gin`).
- Install Swagger for Go (e.g., `go install github.com/swaggo/swag/cmd/swag@latest` and `go get github.com/swaggo/gin-swagger`).
- Install HTTP client for frontend (e.g., Axios: `npm install axios`).
- Set up API versioning (e.g., `/api/v1/`).
- Create a new Git branch for the migration.

### Microphase 1.2: API Design
- Map gRPC methods to REST endpoints:
  - `HelloService.SayHello` → `POST /api/v1/hello`
  - `ProvisioningService.CreateDroplet` → `POST /api/v1/droplets`
  - `ProvisioningService.GetDroplet` → `GET /api/v1/droplets/{id}`
  - `ProvisioningService.ListDroplets` → `GET /api/v1/droplets`
  - `ProvisioningService.DeleteDroplet` → `DELETE /api/v1/droplets/{id}`
  - `DiagnosisService.DiagnoseCluster` → `POST /api/v1/diagnosis/diagnose`
  - `JobService.CreateJob` → `POST /api/v1/jobs`
  - `JobService.GetJob` → `GET /api/v1/jobs/{id}`
  - `JobService.ListJobs` → `GET /api/v1/jobs`
  - `MonitoringService.GetMetrics` → `GET /api/v1/metrics?cluster_id={id}&type={type}`
- Define JSON request/response schemas matching protobuf messages.
- Document endpoints in `docs/api.md` or generate OpenAPI spec.

### Microphase 1.3: Backup and Testing Baseline
- Ensure current gRPC setup builds and runs.
- Create comprehensive tests for existing functionality.
- Back up the codebase.

## Phase 2: Backend Migration
### Microphase 2.1: Framework Integration
- Update `backend/go.mod` to include Gin.
- Modify `backend/core-api/main.go` to initialize HTTP server alongside gRPC (for side-by-side testing).

### Microphase 2.2: Model and Interface Updates
- Add JSON tags to models in `backend/core-api/models/` for marshaling.
- Update interfaces in `backend/core-api/interfaces/` to include REST handler signatures (e.g., `HandleCreateDroplet(c *gin.Context)`).

### Microphase 2.3: Implement REST Handlers
- Create new handlers in `backend/core-api/services/` that wrap existing business logic.
- Add Swagger annotations to handlers (e.g., `@Summary`, `@Description`, `@Tags`).
- Adapt repositories for JSON I/O.
- Implement error handling with HTTP status codes.

### Microphase 2.4: Generate Swagger Documentation
- Run `swag init` in `backend/core-api/` to generate Swagger docs from annotations.
- Integrate `gin-swagger` middleware to serve Swagger UI at `/swagger/*`.
- Use Postman/curl to validate endpoints.
- Ensure JSON responses match expected structures.
- Run unit/integration tests.

## Phase 3: Frontend Migration
### Microphase 3.1: Dependency Updates
- Add Axios to `frontend/package.json`.
- Remove gRPC-Web dependencies (`grpc-web`, protobuf files).

### Microphase 3.2: Model and Interface Updates
- Verify JSON compatibility in `frontend/src/models/`.
- Update `frontend/src/interfaces/` for Promise-based REST calls.

### Microphase 3.3: Replace gRPC Clients
- Update `frontend/src/repositories/` to use Axios instead of gRPC-Web.
- Example: Replace `ProvisioningServiceClient` with `axios.post('/api/v1/droplets', data)`.
- Handle headers, authentication, and errors.

### Microphase 3.4: Remove Protobuf Artifacts
- Delete `frontend/src/hello_pb.js`, `frontend/src/hello_grpc_web_pb.js`.
- Update imports and remove `@ts-ignore` where possible.

### Microphase 3.5: Testing Frontend Changes
- Mock REST responses for isolated testing.
- Ensure UI components work with new data formats.

## Phase 4: Integration and Deployment
### Microphase 4.1: Side-by-Side Operation
- Run gRPC and REST servers simultaneously.
- Use feature flags in frontend to switch implementations.

### Microphase 4.2: Configuration Updates
- Update `docker-compose.yml` for REST ports.
- Modify `start.sh`/`stop.sh` to manage REST server.
- Remove gRPC-Web proxy.

### Microphase 4.3: Shared Component Migration
- Replace `backend/shared/proto/` with JSON schemas or OpenAPI.
- Update any shared logic.

### Microphase 4.4: End-to-End Testing
- Test all features across the stack.
- Validate data consistency.
- Update automated tests.

### Microphase 4.5: Gradual Rollout
- Deploy backend REST first.
- Update frontend incrementally.
- Monitor for issues.

## Phase 5: Cleanup and Optimization
### Microphase 5.1: Remove gRPC Code
- Delete gRPC server code, protobuf files, and dependencies.
- Clean up `go.mod` and `package.json`.

### Microphase 5.2: Documentation and Security
- Update README, Instructions, and Plan docs.
- Ensure Swagger UI is accessible and up-to-date.
- Add CORS, rate limiting, and authentication to REST endpoints.

### Microphase 5.3: Performance Tuning
- Optimize JSON handling for large payloads.
- Consider caching or GraphQL if needed.

### Microphase 5.4: Final Validation
- Full regression testing.
- Production deployment and monitoring.

## Rollback Plan
- Maintain gRPC branch for quick reversion.
- Use API versioning to isolate changes.

## Success Criteria
- All gRPC code removed.
- REST API fully functional.
- No performance degradation.
- Documentation updated.