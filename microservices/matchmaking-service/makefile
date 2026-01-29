
// Makefile
.PHONY: help install build start dev test clean docker-up docker-down migrate backup restore

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $1, $2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

build: ## Build the application
	npm run build

start: ## Start the application in production mode
	npm start

dev: ## Start the application in development mode
	npm run dev

test: ## Run tests
	npm test

test-db: ## Run tests with database setup
	npm run test:db

clean: ## Clean build artifacts
	rm -rf dist coverage

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

migrate: ## Run database migrations
	npm run migration:run

migrate-revert: ## Revert last migration
	npm run migration:revert

migrate-generate: ## Generate new migration
	@read -p "Enter migration name: " name; \
	npm run migration:generate src/migrations/$name

backup: ## Create database backup
	npm run db:backup create

restore: ## Restore database backup
	@read -p "Enter backup file path: " file; \
	npm run db:restore $file

setup: install docker-up migrate ## Complete setup (install, docker, migrate)

health: ## Check application health
	curl -s http://localhost:3000/health | jq .

metrics: ## Get application metrics
	curl -s http://localhost:3000/health/metrics | jq .
