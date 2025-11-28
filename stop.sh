#!/bin/bash

# ClusterGenie Stop Script - Gracefully stop all services

echo "Stopping ClusterGenie services..."

# Stop Docker services
echo "Stopping Docker containers..."
docker-compose down

# Kill any remaining processes (e.g., yarn dev)
echo "Killing any remaining processes..."
pkill -f "yarn dev" || true
pkill -f "docker-compose logs" || true
pkill -f "sleep infinity" || true

echo "All services stopped."