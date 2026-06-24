# Config Service - Getting Started Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Set `ENCRYPTION_KEY` to a secure 32+ character value
- [ ] Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
- [ ] Set `SERVICE_PORT` (default: 3020)
- [ ] Set `NODE_ENV` (development/staging/production)
- [ ] Configure `CACHE_TTL` (default: 3600 seconds)

### 2. Database Setup
- [ ] PostgreSQL 12+ installed
- [ ] Database created (`config_db` by default)
- [ ] Database user has proper permissions
- [ ] Test connection from the service host

### 3. Dependencies
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Run `npm install` to install dependencies
- [ ] Verify no security vulnerabilities: `npm audit`

### 4. Build & Compilation
- [ ] Run `npm run build` successfully
- [ ] No TypeScript compilation errors
- [ ] `dist/` directory created

### 5. Testing
- [ ] Run `npm test` - all unit tests pass
- [ ] Run `npm run test:e2e` - all E2E tests pass
- [ ] Code coverage acceptable: `npm run test:cov`

### 6. Code Quality
- [ ] Run `npm run lint:check` - no errors
- [ ] Run `npm run format:check` - formatted correctly
- [ ] Run `npm run type-check` - no type errors

---

## 🚀 Quick Start Steps

### Option A: Using Docker (Recommended)

```bash
# 1. Navigate to service directory
cd microservices/config-service

# 2. Create environment file
cp .env.example .env

# 3. Update important .env variables:
# ENCRYPTION_KEY=your-secure-key-32-chars-minimum
# DB_HOST=postgres (for docker network)
# SERVICE_PORT=3020

# 4. Start services
docker-compose up -d

# 5. Wait for services to start (10-15 seconds)

# 6. Check health
curl http://localhost:3020/health

# 7. View logs
docker-compose logs -f config-service
```

### Option B: Local Development

```bash
# 1. Navigate to service directory
cd microservices/config-service

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Update .env with your local database details
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=config_db
# DB_USER=postgres
# DB_PASSWORD=your-password

# 5. Run database migrations
npm run migration:run

# 6. Start in development mode
npm run start:dev

# 7. Service will be available at http://localhost:3020
```

---

## 📝 Initial Configuration

### Step 1: Create Environments

```bash
# Development
curl -X POST http://localhost:3020/environments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "development",
    "displayName": "Development",
    "description": "Development environment"
  }'

# Staging
curl -X POST http://localhost:3020/environments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "staging",
    "displayName": "Staging",
    "description": "Staging environment"
  }'

# Production
curl -X POST http://localhost:3020/environments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production",
    "displayName": "Production",
    "description": "Production environment"
  }'
```

### Step 2: Add Initial Configurations

```bash
# Example: Log level
curl -X POST http://localhost:3020/configurations \
  -H "Content-Type: application/json" \
  -d '{
    "key": "LOG_LEVEL",
    "value": "info",
    "type": "string",
    "description": "Application log level",
    "category": "app"
  }'

# Example: Debug mode
curl -X POST http://localhost:3020/configurations \
  -H "Content-Type: application/json" \
  -d '{
    "key": "DEBUG_MODE",
    "value": "false",
    "type": "boolean",
    "description": "Enable debug mode",
    "category": "app"
  }'
```

### Step 3: Create Secrets

```bash
# Database password
curl -X POST http://localhost:3020/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DB_PASSWORD",
    "value": "super-secret-password",
    "description": "Database password",
    "rotationIntervalSeconds": 7776000
  }'

# API keys
curl -X POST http://localhost:3020/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API_KEY",
    "value": "your-api-key-here",
    "description": "External API key",
    "category": "external"
  }'
```

### Step 4: Subscribe Services to Updates

```bash
# Subscribe payment service
curl -X POST http://localhost:3020/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "payment-service",
    "webhookUrl": "http://payment-service:3019/webhooks/config-update",
    "events": ["CONFIG_CREATED", "CONFIG_UPDATED"],
    "secret": "payment-webhook-secret"
  }'

# Subscribe user service
curl -X POST http://localhost:3020/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "user-service",
    "webhookUrl": "http://user-service:3001/webhooks/config-update",
    "events": ["CONFIG_CREATED", "CONFIG_UPDATED"],
    "secret": "user-webhook-secret"
  }'
```

---

## 🔍 Verification Steps

### 1. Service Health
```bash
curl http://localhost:3020/health
# Expected: {"status":"OK","service":"config-service","timestamp":"..."}
```

### 2. Service Info
```bash
curl http://localhost:3020/
# Expected: Service information with available endpoints
```

### 3. API Documentation
Open in browser: `http://localhost:3020/api`
- Swagger UI with all available endpoints

### 4. Database Connection
```bash
# Check if tables exist (from PostgreSQL client)
\dt
# Should see: configurations, environments, secrets, audit_logs, webhook_subscriptions
```

### 5. Configuration Retrieval
```bash
curl http://localhost:3020/configurations
# Should return array of configurations
```

### 6. Secret Management
```bash
curl http://localhost:3020/secrets
# Should return array of secret metadata (values encrypted)
```

### 7. Audit Logs
```bash
curl http://localhost:3020/audit-logs
# Should show creation events from previous steps
```

---

## 🐛 Troubleshooting

### Issue: Port Already in Use
**Solution**: Change `SERVICE_PORT` in `.env` or kill process using port 3020

### Issue: Database Connection Refused
**Steps**:
1. Check PostgreSQL is running
2. Verify connection string in `.env`
3. Ensure database exists
4. Test connection: `psql -h localhost -U postgres -d config_db`

### Issue: Migration Fails
**Steps**:
1. Drop tables: `DROP TABLE IF EXISTS ...;`
2. Run migration again: `npm run migration:run`
3. Check migration status: `npm run migration:show` (if available)

### Issue: Encryption Key Error
**Steps**:
1. Check `ENCRYPTION_KEY` length (minimum 32 characters)
2. Use only alphanumeric characters
3. Update `.env` and restart service

### Issue: Webhook Delivery Fails
**Steps**:
1. Verify webhook URL is accessible
2. Check webhook logs for errors
3. Increase `retryAttempts` and `retryDelayMs` in webhook config
4. Verify signature if using `secret`

### Issue: Cache Issues
**Steps**:
1. Clear cache: `curl -X POST http://localhost:3020/clear-cache`
2. Or restart service (cache is in-memory)

---

## 📊 Performance Tuning

### Caching Configuration
```env
CACHE_TTL=3600           # 1 hour cache validity
CACHE_MAX_SIZE=1000      # Maximum items in cache
```

### Database Connection Pool
Adjust in app.module.ts if needed:
```typescript
// maxConnections, idleTimeoutMillis, etc.
```

### Webhook Retry Configuration
```env
RETRY_ATTEMPTS=3
RETRY_DELAY_MS=5000      # 5 seconds between retries
```

---

## 🔒 Security Checklist

- [ ] ENCRYPTION_KEY is strong (32+ random characters)
- [ ] Database password is strong
- [ ] Webhook secrets are configured
- [ ] CORS is configured properly
- [ ] Environment variables are not committed to git
- [ ] .env file is in .gitignore
- [ ] Database user has minimal required permissions
- [ ] SSL/TLS configured for production
- [ ] Audit logs are monitored
- [ ] Secret rotation is tested

---

## 📈 Monitoring & Maintenance

### Regular Tasks
- [ ] Check audit logs daily for unusual activity
- [ ] Monitor secret rotation schedule
- [ ] Verify webhook delivery success
- [ ] Check database size and backups
- [ ] Review application logs

### Commands
```bash
# View recent audit logs
curl http://localhost:3020/audit-logs?limit=100

# Check secrets needing rotation
curl http://localhost:3020/secrets/rotation/pending

# Check webhook status
curl http://localhost:3020/webhooks

# View application metrics (if enabled)
curl http://localhost:3020/metrics
```

---

## 🎓 Learning Resources

1. **Read the Documentation**
   - `microservices/config-service/README.md` - Complete guide
   - `CONFIG_SERVICE_INTEGRATION.md` - How to use from other services

2. **API Documentation**
   - Available at `http://localhost:3020/api` (Swagger UI)

3. **Source Code**
   - Well-commented code in `src/` directory
   - Examples in `test/` directory

4. **Database Schema**
   - Check schema at `src/entities/`
   - Migrations tracked in database

---

## ✅ Deployment Readiness

Before deploying to production, ensure:

- [ ] All environment variables configured
- [ ] Database backups enabled
- [ ] SSL/TLS certificates installed
- [ ] Monitoring and alerting set up
- [ ] Disaster recovery plan in place
- [ ] Team trained on service usage
- [ ] Documentation accessible to team
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Rollback plan documented

---

## 🎉 You're Ready!

The Config Service is now ready for:
- ✅ Development use
- ✅ Integration testing
- ✅ Staging deployment
- ✅ Production deployment

**Next**: Follow the integration guide to connect other services to this config service.

---

*For detailed information, see CONFIG_SERVICE_INTEGRATION.md*
