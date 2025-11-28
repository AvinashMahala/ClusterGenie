#!/bin/bash

# ClusterGenie Stop Script - Gracefully stop all services

echo "Stopping ClusterGenie services..."

# Stop Docker services
echo "Stopping Docker containers..."
docker-compose down

# Kill gRPC-Web proxy
if [ -f grpcwebproxy.pid ]; then
    echo "Stopping gRPC-Web proxy..."
    kill $(cat grpcwebproxy.pid) 2>/dev/null || true
    rm grpcwebproxy.pid
fi

echo "All services stopped."