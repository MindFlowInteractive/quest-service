# Microservices Database Strategy and Schema Design

## Overview

This document outlines the database architecture strategy for Quest Service microservices, focusing on schema isolation, connection management, and scalability.

## Database Architecture

### Strategy: Database per Service with Shared Infrastructure

We're implementing a **database-per-service** pattern with the following characteristics:

- **Isolation**: Each microservice has its own database
- **Shared Infrastructure**: Common connection pooling, monitoring, and backup systems
- **Cross-Service Communication**: Event-driven communication via message queues
- **Read Replicas**: Read replicas for read-heavy services

## Database Instances

### Primary Databases

| Service | Database Name | Purpose | Replication |
|----------|---------------|---------|-------------|
| quest-service | quest_db | Main application database | Yes |
| game-session-service | game_session_db | Session management | Yes |
| economy-service | economy_db | Transactions, shop, energy | Yes |
| notification-service | notification_db | Notifications, templates | No |
| social-service | social_db | Social features, friends | Yes |
| recommendation-service | recommendation_db | User recommendations | No |

### Shared Infrastructure Database

| Database | Purpose |
|----------|---------|
| quest_shared | User authentication, cross-service data |

## Schema Design Standards

### Naming Conventions

#### Database Names
- Format: `{service}_db`
- Example: `game_session_db`, `economy_db`

#### Table Names
- Format: `{entity_name}` (plural)
- Examples: `sessions`, `transactions`, `shop_items`

#### Column Names
- Use snake_case
- Primary keys: `id` (UUID)
- Foreign keys: `{table}_id`
- Timestamps: `created_at`, `updated_at`

#### Indexes
- Primary indexes on foreign keys
- Composite indexes for common query patterns
- Partial indexes for time-based queries

### Data Types

#### UUIDs
- Use UUID for all primary keys
- Format: `uuid` type in PostgreSQL
- Generated via `gen_random_uuid()`

#### Timestamps
- Use `timestamp with time zone`
- Always store in UTC
- Convert to local time in application layer

#### JSON Data
- Use `jsonb` for structured data
- Index frequently accessed JSON fields
- Use GIN indexes for JSON queries

## Connection Management

### Connection Pools

#### Main Service (quest-service)
```yaml
pool:
  min: 5
  max: 20
  idle_timeout: 30000
  connection_timeout: 10000
```

#### Microservices
```yaml
pool:
  min: 2
  max: 10
  idle_timeout: 30000
  connection_timeout: 10000
```

### Read Replicas

#### Configuration
```yaml
read_replicas:
  - host: postgres-read-1
    port: 5432
    weight: 1
  - host: postgres-read-2
    port: 5432
    weight: 1
```

#### Routing Rules
- Write operations: Primary database
- Read operations: Load balanced across replicas
- Real-time data: Primary database
- Analytics queries: Read replicas

## Migration Strategy

### Migration Framework
- **Tool**: TypeORM migrations
- **Environment**: Separate migrations per service
- **Execution**: Ordered migrations with rollback capability

### Migration Process

1. **Development**
   ```bash
   # Generate migration
   npm run migration:generate -- --name AddNewFeature
   
   # Run migration
   npm run migration:run
   ```

2. **Production**
   ```bash
   # Create migration backup
   pg_dump quest_db > backup_before_migration.sql
   
   # Run migration with dry run
   npm run migration:run -- --dry-run
   
   # Execute migration
   npm run migration:run
   ```

### Migration Conventions

#### File Naming
- Format: `YYYYMMDDHHMMSS-Description.ts`
- Example: `20240424120000-AddEnergySystem.ts`

#### Class Naming
- Format: `DescriptionTimestamp`
- Example: `AddEnergySystem20240424120000`

## Backup Strategy

### Automated Backups

#### Full Backups
- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Storage**: Encrypted S3 bucket

#### Incremental Backups
- **Frequency**: Every 6 hours
- **Retention**: 7 days
- **Storage**: Local encrypted storage

#### Point-in-Time Recovery
- **Frequency**: Every 15 minutes
- **Retention**: 24 hours
- **Storage**: High-speed SSD

### Backup Scripts

```bash
#!/bin/bash
# backup-database.sh

DB_NAME=$1
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress and encrypt
gzip $BACKUP_FILE
gpg --symmetric --cipher-algo AES256 $BACKUP_FILE.gz

# Upload to S3
aws s3 cp $BACKUP_FILE.gz.enc s3://quest-backups/database/

# Cleanup local files
rm $BACKUP_FILE.gz*
```

## Monitoring and Observability

### Database Metrics

#### Connection Metrics
- Active connections
- Connection pool utilization
- Connection latency
- Failed connections

#### Performance Metrics
- Query execution time
- Slow query count
- Index usage statistics
- Table bloat

#### Storage Metrics
- Database size growth
- Table size distribution
- Index size
- WAL (Write-Ahead Log) size

### Alerting Rules

#### Critical Alerts
- Database connection failures
- Disk space > 90%
- Backup failures
- Replication lag > 5 minutes

#### Warning Alerts
- Slow queries > 1 second
- Connection pool > 80% utilization
- Query timeout rate > 1%

## Security Considerations

### Access Control

#### Database Users
```sql
-- Service-specific users
CREATE USER quest_service WITH PASSWORD 'secure_password';
CREATE USER game_session_service WITH PASSWORD 'secure_password';
CREATE USER economy_service WITH PASSWORD 'secure_password';

-- Grant specific privileges
GRANT ALL PRIVILEGES ON DATABASE quest_db TO quest_service;
GRANT ALL PRIVILEGES ON DATABASE game_session_db TO game_session_service;
GRANT ALL PRIVILEGES ON DATABASE economy_db TO economy_service;
```

#### Network Security
- SSL/TLS encryption for all connections
- IP whitelisting for database access
- VPN requirement for admin access

### Data Encryption

#### At Rest
- Transparent Data Encryption (TDE)
- Encrypted backups
- Encrypted storage volumes

#### In Transit
- TLS 1.3 for all connections
- Certificate rotation every 90 days

## Scalability Planning

### Horizontal Scaling

#### Read Scaling
- Multiple read replicas
- Connection pooling
- Query caching

#### Write Scaling
- Database sharding (future)
- Write queue optimization
- Batch operations

### Vertical Scaling

#### Resource Allocation
```yaml
resources:
  quest_service:
    cpu: 2 cores
    memory: 4GB
    storage: 100GB SSD
    
  game_session_service:
    cpu: 1 core
    memory: 2GB
    storage: 50GB SSD
    
  economy_service:
    cpu: 2 cores
    memory: 4GB
    storage: 200GB SSD
```

## Disaster Recovery

### Recovery Procedures

#### Database Corruption
1. Identify corruption extent
2. Failover to replica
3. Restore from recent backup
4. Verify data integrity
5. Update application configuration

#### Complete Outage
1. Activate disaster recovery site
2. Restore from latest backup
3. Update DNS records
4. Monitor system performance
5. Communicate status to stakeholders

### Testing Strategy

#### Backup Verification
- Weekly restore tests
- Data integrity checks
- Application compatibility verification

#### Failover Testing
- Monthly failover drills
- Replica promotion tests
- Network connectivity verification

## Documentation Standards

### Schema Documentation

#### Entity Relationship Diagrams
- Use Mermaid.js for visual documentation
- Include all entities and relationships
- Update with each schema change

#### API Documentation
- Database query examples
- Performance considerations
- Index recommendations

### Operational Documentation

#### Runbooks
- Database maintenance procedures
- Performance tuning guides
- Emergency response procedures
- Troubleshooting checklists

## Implementation Checklist

### Initial Setup
- [ ] Create databases for each service
- [ ] Configure connection pools
- [ ] Set up read replicas
- [ ] Implement backup automation
- [ ] Configure monitoring
- [ ] Test disaster recovery

### Ongoing Maintenance
- [ ] Daily backup verification
- [ ] Weekly performance reviews
- [ ] Monthly security audits
- [ ] Quarterly capacity planning
- [ ] Annual disaster recovery tests

## Migration Guide

### From Monolith to Microservices

1. **Phase 1**: Set up new databases
2. **Phase 2**: Migrate non-critical data
3. **Phase 3**: Implement data synchronization
4. **Phase 4**: Migrate critical data
5. **Phase 5**: Switch traffic to new services
6. **Phase 6**: Decommission old database

### Data Consistency

#### Eventual Consistency
- Use message queues for data synchronization
- Implement idempotent operations
- Handle conflicts with resolution strategies

#### Strong Consistency (Critical Operations)
- Financial transactions
- User authentication
- Game session state

This database strategy provides a solid foundation for scalable, maintainable microservices with proper isolation, security, and disaster recovery capabilities.
