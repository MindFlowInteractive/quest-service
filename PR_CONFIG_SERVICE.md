PR: feat(config-service): add centralized configuration management service

Summary
-------
This PR adds a new, standalone NestJS microservice at `microservices/config-service` that centralizes runtime configuration, environment-scoped settings, feature flags, and encrypted secret management for the platform.

Primary capabilities
--------------------
- Typed key/value configurations with environment scoping and versioning
- Encrypted secret storage and rotation (AES-256-CBC)
- In-memory config caching with TTL and invalidation on update
- Real-time update propagation via webhook subscriptions (HMAC-SHA256 signed)
- Comprehensive audit logging for create/update/delete/rotate events
- Docker + `docker-compose` dev setup and TypeORM integration

Why
---
Centralized configuration simplifies operations, reduces environment drift, enables runtime toggles and feature flags, standardizes secret encryption and rotation, and gives a single audit trail for config changes.

Files added / changed
---------------------
All changes live under `microservices/config-service` (new folder). Highlights:

- `microservices/config-service/package.json` (scripts, deps)
- `microservices/config-service/Dockerfile` and `.dockerignore`
- `microservices/config-service/docker-compose.yml` (service + Postgres)
- `microservices/config-service/.env.example`
- `microservices/config-service/src/config/orm-config.ts`
- `microservices/config-service/src/entities/*` (Config, Environment, Secret, AuditLog, WebhookSubscription)
- `microservices/config-service/src/modules/*` (configuration, secret, environment, audit, webhook)
- `microservices/config-service/src/common/*` (encryption, validation, DTOs)
- `microservices/config-service/src/scripts/seed-environments.ts` (seed script)
- `microservices/config-service/README.md` and docs
- Tests: `microservices/config-service/test/*`

Database / Migrations
---------------------
- Development: TypeORM `synchronize` is enabled when `NODE_ENV !== 'production'` for convenience.
- Production: generate migrations and run them as part of deployment pipeline. DO NOT rely on `synchronize` in production.

How to run locally
-------------------

1) Quick start using Docker (recommended):

```bash
cd microservices/config-service
docker-compose up -d
# Service will be available at http://localhost:3020
```

2) Run locally against a Postgres instance:

```bash
cd microservices/config-service
npm install
cp .env.example .env
# Edit .env: set ENCRYPTION_KEY (secure), DB_HOST, DB_USER, DB_PASSWORD
npm run seed:environments
npm run start:dev
```

API surface (selected endpoints)
-------------------------------
- `GET  /health` — health check
- `GET  /api` — Swagger UI
- `POST /environments` — create environment
- `GET  /environments` — list environments
- `POST /configurations` — create config (key/value)
- `GET  /configurations/key/:key` — get config by key
- `POST /configurations/:id/increment-version` — bump version
- `POST /secrets` — create secret (stored encrypted)
- `GET  /secrets/:id/value` — get decrypted secret value (requires auth in prod)
- `POST /webhooks` — create webhook subscription
- `POST /webhooks/:id/trigger` — trigger webhook (for testing)
- `GET  /audit-logs` — view recent audit logs

Security
--------
- Secrets are encrypted using AES-256-CBC. The `ENCRYPTION_KEY` env var must be populated in production from a secure store (Vault/KMS).
- Webhook payloads are signed with HMAC-SHA256. Consumers MUST verify `X-Webhook-Signature` (or `X-Webhook-Signature` header).
- Audit endpoints should be protected in production (RBAC / internal network only).

Backwards compatibility
-----------------------
This change is additive: it introduces a new service and does not modify existing services. Consumer services must opt-in to use the config service by fetching configuration on startup and/or subscribing to webhooks.

Manual verification (smoke tests)
--------------------------------
1. Health check:

```bash
curl http://localhost:3020/health
```

2. Create environments (seed script also available):

```bash
curl -X POST http://localhost:3020/environments \
  -H "Content-Type: application/json" \
  -d '{"name":"development","displayName":"Development"}'
```

3. Create a configuration and retrieve it:

```bash
curl -X POST http://localhost:3020/configurations \
  -H "Content-Type: application/json" \
  -d '{"key":"FEATURE_X_ENABLED","value":"true","type":"boolean","description":"Toggle for feature X"}'

curl http://localhost:3020/configurations/key/FEATURE_X_ENABLED
```

4. Create and read a secret (decrypted):

```bash
curl -X POST http://localhost:3020/secrets \
  -H "Content-Type: application/json" \
  -d '{"name":"DB_PASSWORD","value":"s3cr3t"}'

# then
curl http://localhost:3020/secrets/<secret-id>/value
```

5. Subscribe a webhook and trigger an event (consumer must validate signature):

```bash
curl -X POST http://localhost:3020/webhooks \
  -H "Content-Type: application/json" \
  -d '{"serviceName":"payment-service","webhookUrl":"http://payment-service:3019/webhooks/config-update","events":["CONFIG_UPDATED"],"secret":"payment-secret"}'

# Trigger update
curl -X POST http://localhost:3020/webhooks/<id>/trigger -d '{"event":"CONFIG_UPDATED","data":{}}'
```

Testing
-------
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Include CI jobs to run both unit and E2E tests (E2E should provision Postgres or use Docker Compose)

Seed and migration notes
------------------------
- `src/scripts/seed-environments.ts` seeds `development`, `staging`, and `production`.
- Before production deploy: run `npm run migration:generate` (or create a migration by hand) and apply with `npm run migration:run`.

Rollout plan
------------
1. Deploy `config-service` to staging with secure environment variables (set `ENCRYPTION_KEY` via vault/KMS).
2. Run DB migrations against staging DB.
3. Run `npm run seed:environments` on staging to create base environments.
4. Update a single consumer service to fetch config on startup and optionally subscribe to webhooks; deploy and verify behavior.
5. Monitor audit logs and webhook delivery. If stable, onboard additional services in waves.

Rollback plan
-------------
- Disable webhook subscriptions for consumers and revert them to local environment variables.
- Revert `config-service` deployment to previous image.
- If DB schema or data is damaged, restore DB from pre-deploy backup.

Review checklist (for the PR)
---------------------------
- [ ] Build passes: `npm run build` in `microservices/config-service`
- [ ] Unit tests: `npm test`
- [ ] E2E tests: `npm run test:e2e`
- [ ] Docker compose starts without errors
- [ ] Seed script creates environments: `npm run seed:environments`
- [ ] Configs and secrets can be created and retrieved via API
- [ ] Webhook delivery and signature verification verified by a consumer service
- [ ] Audit logs contain expected events

Suggested reviewers and labels
-----------------------------
- Reviewers: backend/platform, security, devops
- Labels: `feature`, `service`, `infra`

Notes / Known limitations
------------------------
- In-memory cache is not clustered; for multi-instance deployments use Redis.
- `ENCRYPTION_KEY` currently comes from env — consider KMS integration.
- `synchronize` MUST be disabled for production; use explicit migrations.

Next steps (post-merge)
----------------------
- Add a production migration and include it in the deployment pipeline.
- Add Redis-backed cache and update invalidation strategy for multi-instance clusters.
- Integrate `ENCRYPTION_KEY` with a managed KMS and remove raw key usage in env for production.

PR body created at `PR_CONFIG_SERVICE.md` — review and let me know if you want this formatted differently for GitHub or shortened for a release note.
