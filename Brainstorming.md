# ClusterGenie Brainstorming

This document captures brainstorming sessions and decisions for ClusterGenie. It includes directory structures, architecture ideas, and design choices for future reference. Updated as we progress.

## Directory Structure

Full root-level structure:

```
/ClusterGenie/  # Root repo directory
├── backend/     # All Go microservices
├── frontend/    # React/TypeScript app
├── database/    # DB schemas, migrations, init scripts
├── logs/        # Centralized logs for all services (e.g., app.log, error.log)
├── docs/        # Documentation (API docs, diagrams)
├── setup.sh     # One-command setup script
├── .gitignore   # Ignore build artifacts, logs/, env files
├── docker-compose.yml  # Orchestrates services
├── Makefile     # Tasks (build, test, clean)
├── .env.example # Template for env vars
├── README.md    # Project overview
├── Plan.md      # Development plan
├── Features.md  # Feature specs
└── CHANGELOG.md # Version history
```

### Backend Substructure
Each microservice has its own subdirectory for modularity:

```
/backend/
├── shared/          # Common code (proto files, shared models/interfaces)
│   ├── proto/       # gRPC .proto definitions
│   ├── models/      # Shared structs
│   └── interfaces/  # Shared contracts
├── core-api/        # Core API microservice
│   ├── models/      # Service-specific models
│   ├── interfaces/  # Service interfaces
│   ├── services/    # Business logic
│   ├── repositories/# Data access
│   ├── handlers/    # gRPC handlers
│   └── main.go      # Entry point
├── diagnosis/       # Diagnosis microservice (similar structure)
├── provisioning/    # Provisioning microservice
├── monitoring/      # Monitoring microservice (includes health/logs)
├── go.mod           # Root Go module
└── go.sum
```

### Frontend Substructure
Clear separation for components:

```
/frontend/
├── src/
│   ├── components/
│   │   ├── common/       # Reusable components (e.g., Button/)
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.scss
│   │   │   │   └── index.ts
│   │   ├── features/     # Feature-specific components
│   │   │   ├── Diagnose/
│   │   │   │   ├── DiagnosePanel.tsx
│   │   │   │   ├── DiagnosePanel.scss
│   │   │   │   └── index.ts
│   ├── models/           # TS interfaces/types
│   ├── interfaces/       # Service contracts
│   ├── services/         # Business logic
│   ├── repositories/     # API clients
│   ├── utils/            # Helpers
│   ├── App.tsx
│   └── main.tsx
├── public/               # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

## Key Ideas & Decisions

- **Logging Service**: Dedicated service under `backend/monitoring/` for centralized logging, log rotation, and event handling. Logs stored in `logs/` directory.
- **Separation of Concerns**: Backend uses layered architecture (models → interfaces → services → repositories). Frontend separates common vs. feature components, with per-component SASS.
- **Scalability**: Microservices allow independent scaling; shared code in `backend/shared/`.
- **Best Practices**: SOLID/OOP, DI, clean code. Each component has its own styles for scoping.
- **Demo Focus**: Structure supports easy explanation and incremental building.

## Future References
- Update this file after each brainstorming session.
- Link from README.md for architecture details.