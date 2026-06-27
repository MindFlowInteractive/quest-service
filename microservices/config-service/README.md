# Config Service

Centralized configuration management service for microservices. Manages environment variables, feature flags, secrets with encryption, real-time updates, and audit logging.

## Features

- 🎯 Centralized configuration management
- 🌍 Environment-based configs (dev/staging/prod)
- 🔐 Encrypted secret management with rotation
- 💾 Configuration caching for performance
- 🔄 Real-time config updates via webhooks
- 📝 Complete audit logging
- 🔑 Secret versioning and rotation tracking
- ✅ Service health checks

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose (optional)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
# Important: Change ENCRYPTION_KEY to a secure value
```

### Database Setup

```bash
# Run migrations
npm run migration:run
```

### Development

```bash
# Start in development mode with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug

# Run tests
npm test

# Run e2e tests
npm run test:e2e

# Check coverage
npm run test:cov
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm run start:prod
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f config-service

# Stop services
docker-compose down
```

## API Endpoints

### Health & Info

- `GET /` - Service information
- `GET /health` - Health check
- `GET /api` - Swagger documentation

### Configurations

- `POST /configurations` - Create configuration
- `GET /configurations` - Get all configurations
- `GET /configurations/:id` - Get configuration by ID
- `GET /configurations/key/:key` - Get configuration by key
- `GET /configurations/environment/:environmentId` - Get configs for environment
- `PUT /configurations/:id` - Update configuration
- `DELETE /configurations/:id` - Delete configuration
- `POST /configurations/:id/increment-version` - Increment config version

### Environments

- `POST /environments` - Create environment
- `GET /environments` - Get all environments
- `GET /environments/:id` - Get environment by ID
- `GET /environments/name/:name` - Get environment by name
- `PUT /environments/:id` - Update environment
- `DELETE /environments/:id` - Delete environment

### Secrets

- `POST /secrets` - Create secret (encrypted)
- `GET /secrets` - Get all secrets
- `GET /secrets/:id` - Get secret metadata
- `GET /secrets/:id/value` - Get decrypted secret value
- `GET /secrets/name/:name` - Get secret by name
- `PUT /secrets/:id` - Update secret
- `DELETE /secrets/:id` - Delete secret
- `POST /secrets/:id/rotate` - Rotate secret
- `GET /secrets/rotation/check` - Check secrets needing rotation
- `GET /secrets/rotation/pending` - Get secrets pending rotation

### Webhooks (Real-time Updates)

- `POST /webhooks` - Subscribe service to config changes
- `GET /webhooks` - Get all webhooks
- `GET /webhooks/:id` - Get webhook by ID
- `GET /webhooks/service/:serviceName` - Get webhooks for service
- `PUT /webhooks/:id` - Update webhook
- `DELETE /webhooks/:id` - Delete webhook
- `POST /webhooks/:id/trigger` - Trigger webhook manually

### Audit Logs

- `GET /audit-logs` - Get recent audit logs
- `GET /audit-logs/entity/:entityType/:entityId` - Get logs for entity
- `GET /audit-logs/action/:action` - Get logs for action

## Configuration

### Environment Variables

```env
# Service
SERVICE_NAME=config-service
SERVICE_PORT=3020
NODE_ENV=development
LOG_LEVEL=debug

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=config_db
DB_USER=postgres
DB_PASSWORD=password

# Encryption
ENCRYPTION_KEY=your-secret-encryption-key-32-chars-min
ENCRYPTION_ALGORITHM=aes-256-cbc
ENCRYPTION_IV_LENGTH=16

# Cache
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Features
ENABLE_WEBHOOKS=true
ENABLE_AUDIT_LOG=true
ENABLE_SECRET_ROTATION=true

# Webhooks
WEBHOOK_SECRET=webhook-secret-key
```

## Usage Examples

### Create a Configuration

```bash
curl -X POST http://localhost:3020/configurations \
  -H "Content-Type: application/json" \
  -d '{
    "key": "APP_DEBUG",
    "value": "true",
    "type": "boolean",
    "description": "Enable debug mode",
    "category": "app"
  }'
```

### Create an Environment

```bash
curl -X POST http://localhost:3020/environments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production",
    "displayName": "Production",
    "description": "Production environment"
  }'
```

### Create a Secret

```bash
curl -X POST http://localhost:3020/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DB_PASSWORD",
    "value": "super-secret-password",
    "description": "Database password",
    "rotationIntervalSeconds": 7776000
  }'
```

### Subscribe to Configuration Changes

```bash
curl -X POST http://localhost:3020/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "payment-service",
    "webhookUrl": "http://payment-service:3019/webhooks/config-update",
    "events": ["CONFIG_CREATED", "CONFIG_UPDATED"],
    "secret": "webhook-secret"
  }'
```

### Rotate a Secret

```bash
curl -X POST http://localhost:3020/secrets/secret-id/rotate \
  -H "Content-Type: application/json" \
  -d '{
    "newValue": "new-secret-value"
  }'
```

## Architecture

### Entities

- **Config**: Configuration key-value pairs with versioning
- **Environment**: Environment definitions (dev/staging/prod)
- **Secret**: Encrypted secrets with rotation tracking
- **AuditLog**: Complete audit trail of all changes
- **WebhookSubscription**: Webhook subscriptions for real-time updates

### Modules

- **Configuration**: Core config management
- **Environment**: Environment management
- **Secret**: Encrypted secret management
- **Audit**: Audit logging
- **Webhook**: Real-time notifications

### Services

- **ConfigurationService**: CRUD operations for configs with caching
- **EnvironmentService**: Environment management
- **SecretService**: Encrypted secret management with rotation
- **AuditLogService**: Audit trail logging
- **WebhookService**: Webhook delivery with retry logic
- **EncryptionService**: AES-256-CBC encryption/decryption
- **ValidationService**: Input validation

## Security

- Secrets are encrypted using AES-256-CBC algorithm
- All changes are logged in the audit log
- Webhook signatures using HMAC-SHA256
- Environment-based configuration isolation
- Secret rotation tracking and enforcement

## Performance

- In-memory caching with configurable TTL
- Cache invalidation on config changes
- Efficient database queries with indexes
- Webhook retry logic with exponential backoff

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

## Linting & Formatting

```bash
# Check code style
npm run lint:check

# Fix code style
npm run lint

# Check formatting
npm run format:check

# Format code
npm run format

# Type checking
npm run type-check
```

## Migrations

```bash
# Run pending migrations
npm run migration:run

# Generate migration from entities
npm run migration:generate -- src/migrations/MigrationName

# Revert last migration
npm run migration:revert

# Create empty migration
npm run migration:create -- src/migrations/MigrationName
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
- Ensure database exists: `createdb config_db`

### Encryption Issues

- Ensure ENCRYPTION_KEY is set and is at least 32 characters
- ENCRYPTION_ALGORITHM must match (default: aes-256-cbc)

### Port Already in Use

- Change SERVICE_PORT in .env
- Or kill process using the port

### Cache Issues

- Clear cache manually: DELETE /configurations/{id} recreates cache
- Restart service to clear all cache

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Run linting and formatting before committing
4. Update documentation

## Support

For issues and feature requests, please refer to the main project documentation.

## License

MIT
