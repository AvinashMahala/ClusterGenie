# ClusterGenie Makefile

.PHONY: help build test clean setup logs

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

build: ## Build all services
	@echo "Building backend services..."
	cd backend && go mod tidy
	docker-compose build

test: ## Run tests
	@echo "Running tests..."
	docker-compose exec core-api go test ./...
	# Add more services as implemented

clean: ## Clean up containers and volumes
	@echo "Cleaning up..."
	docker-compose down -v
	docker system prune -f

setup: ## Run setup script
	@echo "Running setup..."
	./setup.sh

logs: ## Show logs
	@echo "Showing logs..."
	docker-compose logs -f