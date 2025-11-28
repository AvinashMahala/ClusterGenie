#!/bin/bash

# ClusterGenie Setup Script

echo "Starting ClusterGenie setup..."

# Check prerequisites
echo "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker not installed. Please install Docker."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose not installed."; exit 1; }
command -v go >/dev/null 2>&1 || { echo "Go not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js not installed."; exit 1; }

echo "Prerequisites OK."

# Setup backend (placeholder)
echo "Setting up backend..."
# Add Go mod tidy, etc., when backend is implemented

# Setup frontend (placeholder)
echo "Setting up frontend..."
# Add npm install, etc., when frontend is implemented

# Start services
echo "Starting Docker services..."
docker-compose up -d

echo "Setup complete. Access at http://localhost:3000 (when frontend is ready)."