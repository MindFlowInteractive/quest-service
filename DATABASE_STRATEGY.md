# 🗄️ Database Strategy & Architecture

This document outlines the database design, schema isolation strategy, and operational conventions for the Quest Service microservices ecosystem.

## 1. Core Architecture: Database-per-Service
To ensure loose coupling and independent scalability, we implement the **Database-per-Service** pattern. While we may share a physical PostgreSQL instance in development (to save resources), logically, each service owns a strictly isolated database.

### Schema Isolation Map
| Microservice | Database Name | Description |
| :--- | :--- | :--- |
| **Quest Service** | `quest_db` | Puzzles, User Progress, Matches |
| **Notification Service** | `notification_db` | Push tokens, Notification logs |
| **Social Service** | `social_db` | Friend graphs, Chat logs, Guilds |

> **Strict Rule:** No service is allowed to directly query another service's database. Data sharing must occur via API calls or Event Bus.

---

## 2. Connection Pooling
We utilize **TypeORM** built-in connection pooling to manage database load efficiently.

**Default Configuration:**
- **Max Connections:** `20` (Configurable via `DB_MAX_CONNECTIONS`)
- **Min Connections:** `5`
- **Idle Timeout:** `30000` (30s)
- **Connection Timeout:** `20000` (20s)

*Strategy:* Each microservice maintains its own pool. In production, these limits should be tuned based on the CPU/RAM of the specific container instance.

---

## 3. Read/Write Splitting (Read Replicas)
To handle high-traffic read operations (e.g., fetching Leaderboards or Puzzle Feeds), services are configured to distinguish between **Write** and **Read** connections.

- **Write Node (`DB_HOST`):** Handles `INSERT`, `UPDATE`, `DELETE`.
- **Read Replica (`DB_READ_HOST`):** Handles `SELECT`.

*Development Context:* In `docker-compose`, both variables point to the same `postgres` container.
*Production Context:* `DB_READ_HOST` points to a distinct Read Replica instance.

---

## 4. Migration Strategy
Database changes are versioned and managed independently by each microservice.

**Conventions:**
- **Tool:** TypeORM Migrations.
- **Workflow:**
  1. Change Entity file (e.g., `user.entity.ts`).
  2. Generate migration: `npm run migration:generate --name=Description`.
  3. Apply migration: `npm run migration:run`.
- **CI/CD:** Migrations run automatically before the application starts in production environments.

---

## 5. Backup & Recovery Strategy

### Automated Backups
- **Frequency:** Daily automated snapshots (00:00 UTC).
- **Type:** Full `pg_dump` of each isolated database.
- **Retention:** 30 Days rolling window.
- **Storage:** Encrypted S3 Bucket (or equivalent cloud storage).

### Point-in-Time Recovery (PITR)
- **WAL Archiving:** Enabled in production to allow restoring the database to a specific second in time (useful for accidental data deletion).

### Disaster Recovery
- **RTO (Recovery Time Objective):** < 1 Hour.
- **RPO (Recovery Point Objective):** < 5 Minutes (data loss tolerance).

---

## 6. Naming Conventions
- **Tables:** `snake_case` (e.g., `user_progress`, `puzzle_attempts`).
- **Columns:** `camelCase` in code map to `snake_case` in DB (handled by TypeORM).
- **Primary Keys:** `id` (UUID v4).
- **Foreign Keys:** `entity_id` (e.g., `user_id`, `quest_id`).