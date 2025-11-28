#!/bin/bash

# ClusterGenie Start Script - Initiates and starts backend/frontend in separate terminals with error handling

set -e  # Exit on error

echo "Starting ClusterGenie services..."

# Function to check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    # Homebrew
    if ! command -v brew >/dev/null 2>&1; then
        echo "Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        if ! command -v brew >/dev/null 2>&1; then
            echo "Error: Failed to install Homebrew. Please install manually."
            exit 1
        fi
        echo "Homebrew installed."
    fi

    # Docker
    if ! command -v docker >/dev/null 2>&1; then
        echo "Docker not found. Installing Docker..."
        brew install --cask docker
        if ! command -v docker >/dev/null 2>&1; then
            echo "Error: Failed to install Docker. Please install Docker Desktop manually from https://www.docker.com/products/docker-desktop"
            exit 1
        fi
        echo "Docker installed. Please ensure Docker Desktop is running."
    fi

    if ! docker info >/dev/null 2>&1; then
        echo "Docker not running. Attempting to start Docker..."
        open -a Docker
        sleep 10
        if ! docker info >/dev/null 2>&1; then
            echo "Error: Docker still not running. Please start Docker Desktop manually."
            exit 1
        fi
    fi

    # Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        echo "Docker Compose not found. Installing via pip..."
        if command -v pip3 >/dev/null 2>&1; then
            pip3 install docker-compose
        else
            echo "Error: pip3 not found. Please install Docker Compose manually."
            exit 1
        fi
        if ! command -v docker-compose >/dev/null 2>&1; then
            echo "Error: Failed to install Docker Compose."
            exit 1
        fi
        echo "Docker Compose installed."
    fi

    # Go
    if ! command -v go >/dev/null 2>&1; then
        echo "Go not found. Installing Go..."
        brew install go
        if ! command -v go >/dev/null 2>&1; then
            echo "Error: Failed to install Go."
            exit 1
        fi
        echo "Go installed."
    fi

    # Node.js
    if ! command -v node >/dev/null 2>&1; then
        echo "Node.js not found. Installing Node.js..."
        brew install node
        if ! command -v node >/dev/null 2>&1; then
            echo "Error: Failed to install Node.js."
            exit 1
        fi
        echo "Node.js installed."
    fi

    # Yarn
    if ! command -v yarn >/dev/null 2>&1; then
        echo "Yarn not found. Installing Yarn..."
        brew install yarn
        if ! command -v yarn >/dev/null 2>&1; then
            echo "Error: Failed to install Yarn."
            exit 1
        fi
        echo "Yarn installed."
    fi

    echo "All prerequisites OK."
}

# Function to start Docker services with retry
start_docker_services() {
    local retries=3
    for i in $(seq 1 $retries); do
        echo "Attempting to start Docker services (attempt $i/$retries)..."
        if docker-compose up -d; then
            echo "Docker services started successfully."
            return 0
        else
            echo "Failed to start Docker services. Retrying in 5 seconds..."
            sleep 5
        fi
    done
    echo "Failed to start Docker services after $retries attempts."
    exit 1
}

# Function to wait for services to be healthy
wait_for_services() {
    echo "Waiting for services to be healthy..."
    local timeout=60
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if docker-compose ps | grep -q "Up"; then
            echo "Services are up."
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
    done
    echo "Services did not start within $timeout seconds."
    exit 1
}

# Check prerequisites
check_prerequisites

# Start Docker services if not running
if ! docker-compose ps | grep -q "Up"; then
    start_docker_services
    wait_for_services
fi

# Initiate backend with error handling
if [ ! -f "backend/core-api/go.sum" ]; then
    echo "Initiating backend..."
    cd backend/core-api
    if ! go mod tidy; then
        echo "Failed to initiate backend. Check Go installation."
        exit 1
    fi
    cd ../..
fi

# Initiate frontend with error handling
if [ ! -d "frontend/node_modules" ]; then
    echo "Initiating frontend..."
    cd frontend
    if ! yarn install; then
        echo "Failed to initiate frontend. Check Yarn installation."
        exit 1
    fi
    cd ..
fi

#!/bin/bash

# ClusterGenie Start Script - Central monitor for all services

set -e

echo "Starting ClusterGenie services..."

# ... (previous functions remain)

# Check prerequisites
check_prerequisites

# Start Docker services if not running
if ! docker-compose ps | grep -q "Up"; then
    start_docker_services
    wait_for_services
fi

# Initiate backend/frontend (same as before)

# Start services in separate terminals
echo "Starting backend services, frontend, and Docker in separate terminals..."

# Core API terminal
echo "Opening terminal for Core API logs..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && docker-compose logs -f core-api\"" > /dev/null 2>&1

# Diagnosis terminal (placeholder)
echo "Opening terminal for Diagnosis service..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Diagnosis service terminal - implement later'; sleep infinity\"" > /dev/null 2>&1

# Provisioning terminal (placeholder)
echo "Opening terminal for Provisioning service..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Provisioning service terminal - implement later'; sleep infinity\"" > /dev/null 2>&1

# Monitoring terminal (placeholder)
echo "Opening terminal for Monitoring service..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Monitoring service terminal - implement later'; sleep infinity\"" > /dev/null 2>&1

# Kafka terminal
echo "Opening terminal for Kafka logs..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && docker-compose logs -f kafka\"" > /dev/null 2>&1

# Frontend terminal
echo "Opening terminal for Frontend dev server..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/frontend && yarn dev\"" > /dev/null 2>&1

# Docker overview terminal
echo "Opening terminal for Docker overview logs..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && docker-compose logs -f\"" > /dev/null 2>&1

# Central monitor terminal
echo "Opening central monitor terminal..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Central Monitor: Run ./stop.sh to stop all services.'; sleep infinity\"" > /dev/null 2>&1

echo "All terminals opened. Use ./stop.sh in the central monitor to stop all."