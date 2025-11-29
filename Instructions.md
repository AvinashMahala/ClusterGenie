# ClusterGenie Setup Instructions

This document outlines the complete sequence of one-time setup steps performed to get ClusterGenie running. These steps ensure all prerequisites are installed and configured for the fullstack REST API application.

## Overview
ClusterGenie is a fullstack application with:
- **Backend**: Go REST API server with Gin and Swagger
- **Frontend**: React/TypeScript with Axios HTTP client
- **Infrastructure**: Docker Compose (MySQL, Redis, Kafka)
- **Communication**: Direct HTTP/JSON between frontend and backend

## One-Time Setup Sequence

### 1. System Prerequisites
These are foundational tools required for development.

#### 1.1 Xcode Command Line Tools
- **Purpose**: Compiler tools, build utilities for macOS
- **Installation**: `xcode-select --install` (interactive)
- **Verification**: `xcode-select -p` returns a path
- **Updates**: `softwareupdate --install --all --force` if available

#### 1.2 Homebrew
- **Purpose**: Package manager for macOS
- **Installation**: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`
- **Verification**: `brew --version`

### 2. Development Tools

#### 2.1 Docker Desktop
- **Purpose**: Container runtime for services
- **Installation**: `brew install --cask docker`
- **Verification**: `docker --version`
- **Startup**: `open -a Docker` (may need manual start)

#### 2.2 Docker Compose
- **Purpose**: Multi-container orchestration
- **Installation**: `pip3 install docker-compose` (if pip3 available)
- **Verification**: `docker-compose --version`

#### 2.3 Go
- **Purpose**: Backend programming language
- **Installation**: `brew install go`
- **Verification**: `go version`
- **Version**: 1.21+ required

#### 2.4 Node.js
- **Purpose**: Frontend JavaScript runtime
- **Installation**: `brew install node`
- **Verification**: `node --version`

#### 2.5 Yarn
- **Purpose**: Frontend package manager
- **Installation**: `brew install yarn`
- **Verification**: `yarn --version`

### 3. REST API Tools

#### 3.1 Swagger CLI (swag)
- **Purpose**: Generate OpenAPI/Swagger documentation from Go REST API code
- **Installation**: `go install github.com/swaggo/swag/cmd/swag@latest`
- **Verification**: `swag --version`

#### 3.2 Go Protobuf Plugins
- **Purpose**: Generate Go code from .proto files
- **Installation**:
  ```bash
  go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
  go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
  ```
- **Verification**: `protoc-gen-go --version`
- **PATH**: Requires `~/go/bin` in PATH

#### 3.3 gRPC-Web Plugin
- **Purpose**: Generate JavaScript/TypeScript clients for gRPC-Web
- **Installation**: `npm install -g protoc-gen-grpc-web`
- **Verification**: `protoc-gen-grpc-web --version`

#### 3.4 grpcwebproxy
- **Purpose**: HTTP proxy for gRPC-Web communication
- **Installation**:
  ```bash
  curl -L https://github.com/improbable-eng/grpc-web/releases/download/v0.15.0/grpcwebproxy-v0.15.0-osx-x86_64.zip -o grpcwebproxy.zip
  unzip grpcwebproxy.zip
  chmod +x dist/grpcwebproxy-v0.15.0-osx-x86_64
  sudo mv dist/grpcwebproxy-v0.15.0-osx-x86_64 /usr/local/bin/grpcwebproxy
  ```
- **Verification**: `grpcwebproxy --help`

### 4. Code Generation

#### 4.1 Go Protobuf Code
- **Purpose**: Generate server/client code for backend
- **Command**:
  ```bash
  cd backend/shared/proto
  export PATH=$PATH:~/go/bin
  protoc --go_out=. --go-grpc_out=. hello.proto
  ```
- **Output**: `hello.pb.go`, `hello_grpc.pb.go`

#### 4.2 TypeScript Protobuf Code
- **Purpose**: Generate client code for frontend
- **Command**:
  ```bash
  cd frontend/src
  protoc -I ../../backend/shared/proto \
    --plugin=protoc-gen-grpc-web=/path/to/protoc-gen-grpc-web \
    --grpc-web_out=import_style=typescript,mode=grpcwebtext:. \
    hello.proto
  ```
- **Output**: `HelloServiceClientPb.ts`, `hello_pb.d.ts`

### 5. Project Dependencies

#### 5.1 Backend Dependencies
- **Go Modules**: `go mod tidy` (resolves gRPC, protobuf libraries)
- **Docker Build**: Builds Go binary with dependencies

#### 5.2 Frontend Dependencies
- **Yarn Install**: `yarn install`
- **Key Packages**:
  - `grpc-web`: gRPC-Web client library
  - `@types/google-protobuf`: TypeScript types

### 6. Configuration Updates

#### 6.1 Backend Code Updates
- **Replace manual types** with generated protobuf code
- **Update imports** to use `github.com/AvinashMahala/ClusterGenie/backend/shared/proto`
- **Add go.mod replace** for local proto package

#### 6.2 Frontend Code Updates
- **Import generated clients** in `App.tsx`
- **Add gRPC-Web call** with proxy configuration
- **Handle responses** and error states

### 7. Runtime Setup

#### 7.1 Docker Services
- **Start**: `docker-compose up -d`
- **Services**: MySQL, Redis, Kafka, core-api
- **Health Check**: Wait for services to be ready

#### 7.2 gRPC-Web Proxy
- **Start**: `grpcwebproxy --backend_addr=localhost:50051 --run_tls_server=false --allow_all_origins`
- **Port**: 8080 (forwards to backend gRPC on 50051)

#### 7.3 Development Servers
- **Frontend**: `yarn dev` (port 3000)
- **Backend**: Runs in Docker container

## Automation in start.sh

The `start.sh` script automates all these steps:

1. **Prerequisite Checks**: Installs missing tools
2. **Code Generation**: Generates protobuf code if missing
3. **Dependency Setup**: Runs `go mod tidy`, `yarn install`
4. **Service Startup**: Docker, proxy, dev servers
5. **Logging**: Detailed logs in `setup.log`

## Troubleshooting

### Common Issues
- **Command Line Tools**: Update with `sudo xcode-select --install`
- **Go Plugins**: Ensure `~/go/bin` in PATH
- **Protobuf Generation**: Check protoc and plugin installations
- **gRPC-Web**: Verify proxy is running on port 8080

### Verification Commands
```bash
# System tools
xcode-select -p
brew --version
docker --version
go version
node --version
yarn --version

# gRPC tools
protoc --version
protoc-gen-go --version
protoc-gen-grpc-web --version
grpcwebproxy --help

# Generated code
ls backend/shared/proto/*.go
ls frontend/src/*Service*.ts
```

## Next Steps
After completing this setup:
1. Run `./start.sh` to launch everything
2. Open http://localhost:5173
3. Click "Call Backend" to test gRPC-Web integration
4. Proceed to Phase 2: Backend architecture layers

This setup ensures a robust development environment for the fullstack gRPC application.