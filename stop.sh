#!/bin/bash

# ClusterGenie Stop Script - Gracefully stop all services

echo "Stopping ClusterGenie services..."

# Stop Docker services
echo "Stopping Docker containers..."
docker-compose down

echo "All services stopped."