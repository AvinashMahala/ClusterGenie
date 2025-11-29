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

# Migration helpers (use docker-based golang-migrate CLI)
MIGRATE_IMAGE ?= migrate/migrate:v4.15.2
MYSQL_HOST ?= localhost
MYSQL_PORT ?= 3306
MYSQL_USER ?= root
MYSQL_PASSWORD ?= rootpassword
MYSQL_DATABASE ?= clustergenie

.PHONY: migrate-up migrate-down migrate-force
migrate-up: ## Run database migrations (up)
	@echo "Running DB migrations (up) against ${MYSQL_HOST}:${MYSQL_PORT}"
	@docker run --rm -v "$(PWD)/database/migrations:/migrations" \
		-e MYSQL_PWD="${MYSQL_PASSWORD}" \
		$(MIGRATE_IMAGE) -path=/migrations -database "mysql://$(MYSQL_USER)@tcp(${MYSQL_HOST}:${MYSQL_PORT})/$(MYSQL_DATABASE)?multiStatements=true" up

migrate-down: ## Run database migrations (down / rollback one step)
	@echo "Rolling back last DB migration on ${MYSQL_HOST}:${MYSQL_PORT}"
	@docker run --rm -v "$(PWD)/database/migrations:/migrations" \
		-e MYSQL_PWD="${MYSQL_PASSWORD}" \
		$(MIGRATE_IMAGE) -path=/migrations -database "mysql://$(MYSQL_USER)@tcp(${MYSQL_HOST}:${MYSQL_PORT})/$(MYSQL_DATABASE)?multiStatements=true" down 1

migrate-force: ## Force-set migration version (useful for CI/emergency)
	@echo "Force-setting migration version -> pass VERSION=number"
	@if [ -z "$(VERSION)" ]; then echo "VERSION must be provided, e.g. make migrate-force VERSION=1"; exit 1; fi
	@docker run --rm -v "$(PWD)/database/migrations:/migrations" \
		-e MYSQL_PWD="${MYSQL_PASSWORD}" \
		$(MIGRATE_IMAGE) -path=/migrations -database "mysql://$(MYSQL_USER)@tcp(${MYSQL_HOST}:${MYSQL_PORT})/$(MYSQL_DATABASE)?multiStatements=true" force $(VERSION)