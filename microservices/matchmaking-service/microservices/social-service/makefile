.PHONY: help install dev prod build test lint format clean docker-up docker-down docker-logs migration-generate migration-run migration-revert

help:
	@echo "Social Service - Available Commands"
	@echo "===================================="
	@echo ""
	@echo "Installation:"
	@echo "  make install          Install dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start development server with hot reload"
	@echo "  make build            Build for production"
	@echo "  make prod             Run production build"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run unit tests"
	@echo "  make test-watch       Run tests in watch mode"
	@echo "  make test-cov         Run tests with coverage"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             Fix linting issues"
	@echo "  make format           Format code with Prettier"
	@echo "  make type-check       TypeScript type checking"
	@echo ""
	@echo "Database:"
	@echo "  make migration-generate   Generate new migration"
	@echo "  make migration-run        Run pending migrations"
	@echo "  make migration-revert     Revert last migration"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up        Start Docker containers"
	@echo "  make docker-down      Stop Docker containers"
	@echo "  make docker-clean     Remove containers and volumes"
	@echo "  make docker-logs      View Docker logs"
	@echo "  make docker-build     Build Docker image"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            Clean build and dist directories"
	@echo "  make health           Check service health"
	@echo ""

install:
	npm install

dev:
	npm run start:dev

prod:
	npm run start:prod

build:
	npm run build

test:
	npm run test

test-watch:
	npm run test:watch

test-cov:
	npm run test:cov

lint:
	npm run lint

format:
	npm run format

format-check:
	npm run format:check

type-check:
	npm run type-check

migration-generate:
	npm run migration:generate

migration-run:
	npm run migration:run

migration-revert:
	npm run migration:revert

docker-up:
	docker-compose -f docker/docker-compose.yml up -d

docker-down:
	docker-compose -f docker/docker-compose.yml down

docker-clean:
	docker-compose -f docker/docker-compose.yml down -v

docker-logs:
	docker-compose -f docker/docker-compose.yml logs -f

docker-build:
	docker build -f docker/Dockerfile -t social-service:latest .

clean:
	rm -rf dist coverage node_modules

health:
	curl http://localhost:3001/health

setup: install docker-up migration-run
	@echo "✅ Social Service setup complete!"
	@echo "🚀 Server running at http://localhost:3001"
	@echo "📊 Health check: make health"

dev-setup: install docker-up migration-run dev
	@echo "✅ Development environment ready!"

help-docker:
	@echo "Docker Commands"
	@echo "=============="
	@echo ""
	@echo "View running containers:"
	@echo "  docker-compose -f docker/docker-compose.yml ps"
	@echo ""
	@echo "View all services:"
	@echo "  docker ps -a"
	@echo ""
	@echo "Execute command in container:"
	@echo "  docker exec social-service npm run migration:run"
	@echo ""
	@echo "Access PostgreSQL:"
	@echo "  docker exec -it postgres-social psql -U postgres -d quest_service"
	@echo ""

help-api:
	@echo "API Testing Examples"
	@echo "===================="
	@echo ""
	@echo "Health Check:"
	@echo "  curl http://localhost:3001/health"
	@echo ""
	@echo "Send Friend Request:"
	@echo "  curl -X POST http://localhost:3001/friends/request \\"
	@echo "    -H 'Content-Type: application/json' \\"
	@echo "    -d '{\"recipientId\": \"uuid-here\"}'"
	@echo ""
	@echo "Get Leaderboard Top 10:"
	@echo "  curl http://localhost:3001/leaderboards/top?limit=10"
	@echo ""
	@echo "Create Multiplayer Room:"
	@echo "  curl -X POST http://localhost:3001/rooms \\"
	@echo "    -H 'Content-Type: application/json' \\"
	@echo "    -d '{\"name\": \"Room Name\", \"maxPlayers\": 2}'"
	@echo ""
