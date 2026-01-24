# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 1. Project overview & layout

This repository contains a **NestJS monolith** for the core Quest puzzle platform plus a set of **supporting microservices** under `microservices/`.

High-level pieces:
- **Core quest-service (monolith, root app)**
  - Located in `src/` with standard NestJS structure (`app.module.ts`, feature modules, controllers, services).
  - Implements puzzle management, game engine integration, puzzle editor, tournaments, and the main REST API.
  - Backed by PostgreSQL via TypeORM with a rich schema documented in `DATABASE_SCHEMA.md` and `SYSTEM_OVERVIEW.md`.
- **Microservices (NestJS)** in `microservices/`:
  - `quest-service/`: lightweight Nest starter for a scoped quest-related service.
  - `social-service/`: friends, leaderboards, multiplayer rooms, WebSocket gateway (see `microservices/social-service/INDEX.md` and `QUICKSTART.md`).
  - `notification-service/`: real-time notifications, BullMQ queues, templates (see its `IMPLEMENTATION_SUMMARY.md`).
  - `game-session-service/`: game session lifecycle, state snapshots, replay hooks (see its `README.md`).
  - `replay-service/`: full-featured replay recording, compression, analytics, privacy/sharing (see `microservices/replay-service/IMPLEMENTATION_SUMMARY.md` and `QUICKSTART.md`).
  - `economy-service/`: energy/stamina, shop, transactions (see its `README.md`).
  - `moderation-service/`: content moderation queue and review workflows.
  - `api-gateway/`: Nest-based gateway fronting selected microservices.
  - `shared/`: shared Nest module and utilities for events, gRPC, and service discovery; includes `proto/notification.proto` and `proto/social.proto`.
- **Infrastructure & tooling** (root):
  - `docker-compose.yml`: PostgreSQL, Redis, RabbitMQ, quest-service container, selected microservices, and monitoring stack (Prometheus, Loki, Promtail, Jaeger, Grafana).
  - `scripts/setup-database.sh` and `DATABASE_SCHEMA.md`: database bootstrapping and schema details.
  - `MONITORING.md`: observability stack and troubleshooting runbooks.
  - Domain-specific docs: `PUZZLE_ENGINE_STATUS.md`, `PUZZLE_EDITOR_IMPLEMENTATION_SUMMARY.md`, `TOURNAMENT_IMPLEMENTATION.md`, `SYSTEM_OVERVIEW.md`.

When making non-trivial changes, prefer consulting the related domain doc first; they usually summarize entities, APIs, and acceptance criteria.

## 2. Core commands (root quest-service app)

All commands below assume you are at the repository root (`quest-service/`).

### 2.1 Install & environment

```bash
# Install dependencies
npm install

# Copy environment template and edit for your DB
cp .env.example .env

# (Optional) Start PostgreSQL via Docker
docker-compose up -d postgres
```

### 2.2 Database migrations & seeding

TypeORM is wired via `ormconfig.ts`.

```bash
# Run pending migrations against the main quest database
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate a new migration (name will be appended)
npm run migration:generate src/migrations/<MigrationName>

# Seed baseline and performance data (if needed)
npm run seed:run
npm run seed:perf

# Full DB setup helper (uses migrations & scripts)
./scripts/setup-database.sh
```

### 2.3 Running the main API

```bash
# Development (watch mode)
npm run start:dev

# Production build & run
npm run build
npm run start:prod

# Health & docs (once running)
curl http://localhost:3000/health
# Swagger/OpenAPI is typically exposed at
#   http://localhost:3000/api
```

### 2.4 Linting, formatting, and type-checking

```bash
# Lint and auto-fix
npm run lint

# Lint without fixing
npm run lint:check

# Format with Prettier
npm run format

# TypeScript type-check only (no emit)
npm run type-check
```

### 2.5 Tests (root app)

Jest is configured with multiple test configs under `test/`.

```bash
# All unit-style tests ("*.spec.ts")
npm run test:unit

# Integration tests ("*.integration.spec.ts")
npm run test:integration

# End-to-end tests ("*.e2e.spec.ts" via test/jest-e2e.json)
npm run test:e2e

# Smoke and performance suites
npm run test:smoke
npm run test:performance

# Combined test run
npm run test:all

# Coverage for unit tests
npm run test:cov

# Run a single test file or pattern
npm run test:unit -- --testPathPattern=<partial-file-name>

# Watch mode while developing
npm run test:watch
```

## 3. Docker & full-stack workflows

### 3.1 Run the full stack locally (root-level compose)

The root `docker-compose.yml` brings up PostgreSQL, Redis, RabbitMQ, quest-service, selected microservices, and monitoring.

```bash
# Bring up the entire stack with fresh builds
cp .env.example .env   # if not already done
docker-compose up --build

# Subsequent runs without rebuilding
docker-compose up -d

# Stop and remove containers
docker-compose down

# View logs for all services
docker-compose logs -f
```

Key ports (default, see `docker-compose.yml` and related service readmes):
- Core quest-service API: `http://localhost:3000`
- Notification service: `http://localhost:3001`
- Social service: `http://localhost:3002`
- Replay service: `http://localhost:3007`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ (AMQP / UI): `5672` / `15672`
- Grafana: `http://localhost:3003`
- Prometheus: `http://localhost:9090`
- Jaeger: `http://localhost:16686`
- Loki: `3100` (queried via Grafana)

### 3.2 Microservice-specific workflows

Each Nest-based microservice under `microservices/` follows a consistent pattern:

```bash
cd microservices/<service-name>

# Install dependencies
npm install

# Run in development
npm run start:dev

# Run tests
npm test

# Lint / format / type-check (when scripts exist)
npm run lint
npm run format
npm run type-check
```

Service-specific docs to consult before non-trivial edits:
- `microservices/social-service/INDEX.md` and `QUICKSTART.md` for friends, leaderboards, rooms, WebSocket events, and DB migrations (`npm run migration:run`).
- `microservices/notification-service/IMPLEMENTATION_SUMMARY.md` for notification channels, BullMQ queues, and migration workflow (`npm run migration:run`).
- `microservices/replay-service/IMPLEMENTATION_SUMMARY.md` and `QUICKSTART.md` for replay storage, compression, analytics, and its dedicated Docker stack.
- `microservices/game-session-service/README.md` for session, snapshot, and replay-related APIs.
- `microservices/economy-service/README.md` for energy, shop, transactions, and payment providers.

## 4. Architecture notes (core quest-service)

### 4.1 Core domains & modules

The monolith is organized by domain-specific Nest modules (see `SYSTEM_OVERVIEW.md`, `PUZZLE_ENGINE_STATUS.md`, `PUZZLE_EDITOR_IMPLEMENTATION_SUMMARY.md`, `TOURNAMENT_IMPLEMENTATION.md`):
- **Puzzle Management & Game Engine**
  - CRUD and analytics for puzzles, including search, tagging, difficulty, and bulk operations.
  - A dedicated puzzle engine supports multiple puzzle types (logic grid, sequence, spatial) with difficulty scaling, hints, scoring, and achievements.
- **Puzzle Editor & Creation Tools**
  - Extensive editor module (`src/puzzle-editor/...`) for drag-and-drop puzzle composition, validation, preview/simulation, versioning, templates, batch operations, import/export, and community submissions.
  - Editor endpoints produce published puzzle definitions that the game engine consumes.
- **Game Sessions & Progress**
  - Entities and services for tracking per-user puzzle progress, sessions, and aggregated user stats.
  - Integration with achievements and leaderboards.
- **Tournaments**
  - Tournament module (`src/tournaments/...`) implements multiple bracket types (single/double elimination, round-robin, Swiss), registration, match scheduling, prize distribution, spectators, and stats.
- **Cross-cutting infrastructure**
  - Auth (JWT-based), throttling, health checks, metrics exposure, structured logging, and Sentry integration.
  - Database access via TypeORM with a large, well-indexed schema (`DATABASE_SCHEMA.md`).

When modifying any of these domains, always check their dedicated `*_IMPLEMENTATION*.md` or status docs for current behavior, file layout, and acceptance criteria.

### 4.2 Database strategy

See `DATABASE_STRATEGY.md` and `DATABASE_SCHEMA.md` for full details; key points:
- **Database-per-service pattern**: each microservice owns its own logical database (e.g., `quest_db`, `notification_db`, `social_db`), even if they share a PostgreSQL instance in development.
- **No cross-database querying**: services communicate via HTTP/gRPC or events, not by reading each other’s tables.
- **Read/write split support** in configuration (e.g., `DB_HOST` vs `DB_READ_HOST`) for future read replicas.
- Heavy use of JSONB, composite and partial indexes, and constraints/checks to enforce invariants (e.g., achievement unlock logic, progress consistency).

## 5. Inter-service communication & integration

The microservice ecosystem uses both asynchronous events and synchronous RPC; see `microservices/INTER_SERVICE_COMMUNICATION.md` for details.

Key aspects:
- **Message brokers**
  - RabbitMQ: topic exchanges, durable queues, dead-letter queues, exponential backoff retries.
  - Redis/BullMQ: job queues with prioritization, scheduled jobs, dead-letter queues.
- **Event-driven model**
  - Domain events such as `UserRegisteredEvent`, `PuzzleCompletedEvent`, `AchievementUnlockedEvent`, `FriendRequestSentEvent`, `TournamentStartedEvent`, `NotificationCreatedEvent`.
  - Shared event contracts and handler interfaces live in `microservices/shared`.
- **gRPC**
  - gRPC clients generated from `microservices/shared/proto/*.proto` for synchronous calls to services like social and notification.
  - A shared `GrpcClientService` abstraction handles client lookup, timeouts, and error handling.
- **Service discovery & health**
  - Services register themselves in a service registry abstraction and expose health endpoints (`/health`, `/health/ready`, `/health/live`).
  - Discovery helpers resolve service URLs and choose healthy instances.

When introducing new cross-service flows, prefer modeling them as events that reuse the existing event bus and gRPC abstractions instead of hand-rolling new communication mechanisms.

## 6. Observability & debugging

The monitoring stack is documented in `MONITORING.md` and wired through `docker-compose.yml`.

- **Metrics**
  - Each service exposes Prometheus metrics (commonly via `/metrics`); Prometheus scrapes on a fixed interval.
  - The root quest-service also exposes health endpoints under `/health` and metrics under a dedicated path used by Prometheus.
- **Logs**
  - Docker containers log in JSON format; Promtail ships logs to Loki.
  - Query logs via Grafana’s Explore view with the Loki datasource.
- **Tracing**
  - Jaeger is available at `http://localhost:16686` for distributed tracing when OpenTelemetry/Jaeger SDKs are enabled in a service.
- **Dashboards**
  - Grafana (admin/admin by default) aggregates metrics, logs, and traces into dashboards.

For production-like debugging, prefer using metrics + traces (to locate issues) and then drill into service logs for detailed context.

## 7. Recommended entry points for new work

For future agents starting a new task:
- **Understand the system**: skim `SYSTEM_OVERVIEW.md`, then the specific domain doc (`PUZZLE_ENGINE_STATUS.md`, `PUZZLE_EDITOR_IMPLEMENTATION_SUMMARY.md`, `TOURNAMENT_IMPLEMENTATION.md`, `DATABASE_SCHEMA.md`) relevant to your change.
- **If the task involves microservices**: read `microservices/INTER_SERVICE_COMMUNICATION.md`, then the relevant service’s README/QUICKSTART/IMPLEMENTATION_SUMMARY.
- **When modifying APIs**: update DTOs, entities, and Swagger decorators together, and verify with the appropriate Jest suite plus e2e tests.
- **When touching persistence**: update entities and migrations in tandem, and run `npm run migration:run` (or the corresponding microservice migration scripts) against a local/dev database.