PR: Centralized Configuration Management Service (microservices/config-service)

Summary
-------
Adds a new standalone NestJS microservice, `config-service`, providing centralized configuration, environment management, encrypted secrets, webhook-based real-time updates, caching, versioning, and audit logging for the monorepo.

Why
---
Centralize management of environment variables, feature flags, and secrets to simplify configuration drift, enable runtime updates, centralize audit trails, and standardize secret rotation across services.

Scope / Files Changed
---------------------
New service added at: `microservices/config-service`
Key files and folders (high-level):
- `microservices/config-service/package.json`
- `microservices/config-service/Dockerfile`
- `microservices/config-service/docker-compose.yml`
- `microservices/config-service/.env.example`
- `microservices/config-service/src/app.module.ts`
- `microservices/config-service/src/main.ts`
- `microservices/config-service/src/entities/*` (Config, Environment, Secret, AuditLog, WebhookSubscription)
- `microservices/config-service/src/modules/*` (configuration, secret, environment, audit, webhook modules)
- `microservices/config-service/src/common/*` (encryption, validation, DTOs)
- `microservices/config-service/README.md` and related docs
- Tests: `microservices/config-service/test/*`

Implementation Details
----------------------
- Database: PostgreSQL via TypeORM (entities + orm-config)
- Secrets: AES-256-CBC encryption with IV; encrypted values stored in DB, rotation support
- Configs: key/value store, typed (string|number|boolean|json), environment-scoped, versioned
- Caching: in-memory cache (CacheManager) with configurable TTL and invalidation on updates
- Webhooks: subscription model, HMAC-SHA256 signing, retry logic with backoff
- Audit log: stores CREATE/UPDATE/DELETE/ROTATE events with metadata
- API docs: Swagger available at `/api`
- Docker: Dockerfile and docker-compose (includes PostgreSQL) for local/dev runs

Database Migrations
-------------------
- Entities are set to `synchronize` when `NODE_ENV !== 'production'`.
- For production, run migrations generated from entities.

Commands
--------
Install and run locally:
```bash
cd microservices/config-service
npm install
cp .env.example .env
# Edit .env => set ENCRYPTION_KEY and DB credentials
npm run migration:run    # if using migrations
npm run start:dev
```

Docker (recommended for quick local setup):
```bash
cd microservices/config-service
docker-compose up -d
# Access: http://localhost:3020
```

Testing
-------
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Basic unit and e2e tests are included; CI should run these on PR.

Rollout & Migration Plan
------------------------
1. Deploy `config-service` to staging with production-like env vars (ensure `ENCRYPTION_KEY` is set and secure).
2. Run DB migrations against staging database.
3. Create initial environments (`development`, `staging`, `production`) via API or seed script.
4. Add initial configurations and secrets required by services.
5. For each dependent service:
   - Add `CONFIG_SERVICE_URL` and `WEBHOOK_URL` env vars.
   - Add startup logic to fetch required configs on boot (examples provided in `CONFIG_SERVICE_INTEGRATION.md`).
   - Optionally subscribe service webhook endpoints to `config-service` for real-time updates.
6. Deploy one consumer service to staging and verify config fetch and webhook behavior.
7. Monitor audit logs and webhook deliveries.

Rollback Plan
-------------
- If `config-service` causes issues, remove or disable webhook subscriptions from consumer services and revert consumer service config to local environment-based values.
- Restore DB from backup prior to deploy if schema or data corruption occurs.
- Redeploy previous version of `config-service` image.

Secrets & Rotation
------------------
- Secrets stored encrypted (DB: `encryptedValue`, `iv`).
- Rotation API available: `POST /secrets/:id/rotate`.
- Rotation detection task exists (check endpoints `GET /secrets/rotation/check`).
- Ensure `ENCRYPTION_KEY` is stored securely in production (vault, KMS).

Security Considerations
-----------------------
- Do not commit `.env` or secret values.
- Use a secure `ENCRYPTION_KEY` (32+ chars) in production and rotate as needed.
- Webhook requests signed with HMAC-SHA256; consumers must verify signatures.
- Audit logs store changes; restrict access to audit endpoints.

Testing & Verification Checklist (for reviewer)
-----------------------------------------------
- [ ] Service builds successfully: `npm run build`
- [ ] Unit tests pass: `npm test`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Docker compose starts services and PostgreSQL
- [ ] Can create environment, config, and secret via API
- [ ] Secrets are stored encrypted (DB) and `GET /secrets/:id/value` returns decrypted value
- [ ] Webhook delivery works and signature verification can be validated by consumer
- [ ] Audit logs contain CREATE/UPDATE/DELETE events
- [ ] Config caching is invalidated on update
- [ ] Version increment endpoint works (`POST /configurations/:id/increment-version`)

Notes / Known Limitations
-------------------------
- `synchronize` is enabled in non-production by default; production should use migrations.
- Secret encryption uses a symmetric key from env; for stronger security consider integration with KMS (AWS KMS, HashiCorp Vault).
- Scaling: current cache is in-memory; for multi-instance deployments use Redis-backed caching for shared cache invalidation.

Suggested Reviewers
-------------------
- Backend/Platform: @backend-team
- Security: @security-team
- DevOps: @devops-team

Labels
------
- feature
- service
- infra

Release Notes
-------------
Adds a new centralized configuration management service for the platform providing environment-scoped configs, encrypted secrets with rotation, webhooks for real-time updates, in-memory caching, audit logs, and Docker deployment.

Next Steps
----------
- Consider adding a DB migration and seed script for initial environments.
- Optionally integrate with a KMS for encryption key management.

File: `PR_CONFIG_SERVICE.md` created at repo root. Review and let me know if you want this copied to a GitHub PULL_REQUEST_TEMPLATE or a different format/branch ready for a PR.
