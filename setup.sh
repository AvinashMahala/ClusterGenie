#!/bin/bash

# ClusterGenie Setup Script - Initialize database and other setup tasks

set -e  # Exit on error

echo "🚀 ClusterGenie Setup Script"
echo "Initializing database schema..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Start MySQL if not running
if ! docker-compose ps mysql | grep -q "Up"; then
    echo "Starting MySQL..."
    docker-compose up -d mysql
    sleep 10
fi

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
for i in {1..30}; do
    if docker-compose exec -T mysql mysql -uroot -prootpassword -e "SELECT 1" >/dev/null 2>&1; then
        break
    fi
    sleep 2
done

# Check if tables exist
if ! docker-compose exec -T mysql mysql -uroot -prootpassword clustergenie -e "SHOW TABLES;" | grep -q "clusters"; then
    echo "Initializing database schema..."
    docker-compose exec -T mysql mysql -uroot -prootpassword clustergenie < database/init.sql
    echo "✅ Database schema initialized"
else
    echo "✅ Database schema already exists"
fi

echo "Setup complete!"