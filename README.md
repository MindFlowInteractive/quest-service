# README.md

# PostgreSQL TypeORM Database Setup

A comprehensive PostgreSQL database setup with TypeORM integration, featuring connection management, health checks, monitoring, and automated backup/restore functionality.

## Features

- ✅ PostgreSQL Docker container with custom configuration
- ✅ TypeORM integration with connection pooling
- ✅ Environment-based configuration management
- ✅ Database migration system with CLI support
- ✅ Health checks and retry mechanisms
- ✅ Separate test database configuration
- ✅ Automated backup and restore scripts
- ✅ Database monitoring and performance tracking
- ✅ Query optimization and logging
- ✅ Index strategy implementation

## Quick Start

1. **Clone and install dependencies:**

   ```bash
   make install
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start the application:**

   ```bash
   make setup  # This will install, start Docker, and run migrations
   ```

4. **Verify setup:**
   ```bash
   make health
   ```

## Project Structure

```
├── src/
│   ├── config/
│   │   └── database.config.ts    # Database configuration service
│   ├── entities/
│   │   ├── base.entity.ts        # Base entity with common fields
│   │   └── user.entity.ts        # Example user entity
│   ├── migrations/               # Database migrations
│   ├── services/
│   │   └── database.service.ts   # Database connection management
│   ├── monitoring/
│   │   └── performance.service.ts # Performance monitoring
│   └── health/
│       └── health.controller.ts  # Health check endpoints
├── scripts/
│   └── backup.ts                 # Backup and restore utilities
├── docker/
│   ├── init-scripts/             # Database initialization
│   └── postgresql.conf           # PostgreSQL configuration
├── tests/                        # Test files
└── docker-compose.yml            # Docker services
```

## Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=password

# Connection Pooling
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=5
DB_CONNECTION_TIMEOUT=20000
DB_ACQUIRE_TIMEOUT=20000
DB_IDLE_TIMEOUT=30000

# Test Database
TEST_DB_PORT=5433
TEST_DB_NAME=myapp_test
```

### Database Features

- **Connection Pooling**: Configurable min/max connections with timeout settings
- **Health Checks**: Automated health monitoring with retry mechanisms
- **Performance Monitoring**: Query performance tracking and optimization
- **Backup System**: Automated backup creation and restoration
- **Migration System**: Version-controlled database schema changes
- **Test Isolation**: Separate test database configuration

## Usage

### Development Commands

```bash
# Development
make dev                    # Start in development mode
make test                   # Run tests
make test-db               # Run tests with database setup

# Database Operations
make migrate               # Run migrations
make migrate-revert        # Revert last migration
make migrate-generate      # Generate new migration

# Backup Operations
make backup                # Create database backup
make restore               # Restore from backup

# Monitoring
make health                # Check application health
make metrics               # Get performance metrics
```

### Migration System

Generate a new migration:

```bash
make migrate-generate
# Enter migration name when prompted
```

Run migrations:

```bash
make migrate
```

Revert last migration:

```bash
make migrate-revert
```

### Backup and Restore

Create backup:

```bash
npm run db:backup create
```

List available backups:

```bash
ts-node scripts/backup.ts list
```

Restore from backup:

```bash
npm run db:restore path/to/backup.sql
```

### Health Monitoring

The application provides several health endpoints:

- `GET /health` - Basic health check with connection status
- `GET /health/metrics` - Detailed performance metrics
- `GET /health/connections` - Connection pool statistics

Example health response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": {
    "connection": true,
    "latency": "15ms",
    "activeConnections": 3
  }
}
```

## Testing

The project includes comprehensive testing with:

- Isolated test database configuration
- Database connection testing
- Migration system testing
- Health check validation
- Performance monitoring tests

Run tests:

```bash
make test-db  # Includes database setup
make test     # Tests only
```

## Performance Optimization

### Included Optimizations

- **Connection Pooling**: Optimized pool settings for different environments
- **Query Logging**: Configurable query logging with execution time tracking
- **Index Strategy**: Automatic indexing on common query patterns
- **Cache Configuration**: Query result caching for improved performance
- **Monitoring**: Real-time performance metrics and slow query detection

### PostgreSQL Configuration

The included `postgresql.conf` provides optimized settings for:

- Connection management
- Memory usage
- Query performance
- Logging and monitoring

## Docker Services

The `docker-compose.yml` includes:

- **PostgreSQL Main**: Primary database (port 5432)
- **PostgreSQL Test**: Test database (port 5433)
- **Adminer**: Database administration UI (port 8080)

Access Adminer at `http://localhost:8080` for database management.

## Production Considerations

1. **Security**: Update default passwords and use secure credentials
2. **Monitoring**: Set up external monitoring for production databases
3. **Backups**: Configure automated backup schedules
4. **Performance**: Monitor and tune based on actual usage patterns
5. **Scaling**: Adjust connection pool settings based on load

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Increase `DB_CONNECTION_TIMEOUT` value
2. **Pool Exhaustion**: Adjust `DB_MAX_CONNECTIONS` setting
3. **Migration Failures**: Check database permissions and syntax
4. **Test Database Issues**: Ensure test database is running on correct port

### Debug Mode

Enable detailed logging:

```bash
export DB_LOGGING=true
export LOG_LEVEL=debug
```

This implementation provides a production-ready PostgreSQL setup with TypeORM that meets all the specified requirements and acceptance criteria.
