# APM Implementation for Quest Service

This document describes the Application Performance Monitoring (APM) implementation for the quest service, including all features requested.

## Features Implemented

### 1. API Endpoint Response Time Tracking
- Automatic interception of all API requests using `PerformanceInterceptor`
- Tracks response time for all endpoints with method, route, and status code labels
- Prometheus histogram metric: `api_response_time_seconds`

### 2. Database Query Performance Monitoring
- Monitors all database operations using decorators (`@MonitorQuery`, `@AutoMonitorQuery`)
- Tracks query execution time with operation type, table name, and success status
- Prometheus histogram metric: `db_query_time_seconds`

### 3. Slow Query Detection and Logging
- Configurable thresholds for detecting slow queries (default: 100ms)
- Automatic logging of slow queries with optimization suggestions
- Prometheus counter metric: `slow_queries_total`

### 4. Memory Usage Tracking
- Real-time monitoring of memory usage (RSS, heap total, heap used, external)
- Prometheus gauge metrics: `memory_usage_bytes` with type labels
- Memory leak detection when heap usage exceeds 80%

### 5. Custom Performance Metrics
- Support for registering custom metrics using the PerformanceService
- Flexible metric types: counters, gauges, histograms
- Easy-to-use API for recording custom business metrics

### 6. Performance Dashboard Endpoints
- `/metrics` - Raw Prometheus metrics in text format
- `/metrics/dashboard` - Human-readable performance summary
- `/metrics/health` - Health status with performance indicators

### 7. Automatic Alerting for Degradation
- Cron-based performance checks every minute
- Memory leak detection and alerts
- High slow query count detection and alerts
- Configurable alert thresholds
- Multiple alert channels (console, structured logs)

### 8. Query Optimization Suggestions
- Automated suggestions for slow queries based on operation type
- Duration-based recommendations
- Best practice guidance for common query patterns

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Request   │───▶│ Performance      │───▶│ Prometheus      │
│                 │    │ Interceptor      │    │ Metrics         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │ Performance      │
                    │ Service          │
                    └──────────────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
        Database      Memory      Alerts
        Monitoring    Tracking    Service
```

## Configuration

### Environment Variables
The service uses the same environment variables as the base application:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USERNAME` - Database username (default: postgres)
- `DB_PASSWORD` - Database password (default: postgres)
- `DB_DATABASE` - Database name (default: quest_service)

### Alert Thresholds
Default thresholds can be customized:

- Max API Response Time: 1000ms
- Max Memory Usage: 80%
- Max CPU Usage: 85%
- Max Slow Queries Per Minute: 5

## Endpoints

### Metrics Endpoints
- `GET /metrics` - Prometheus-formatted metrics
- `GET /metrics/dashboard` - JSON performance summary
- `GET /metrics/health` - Health check with performance status

### API Endpoints (with performance monitoring)
- `GET /quests` - Retrieve all active quests
- `GET /quests/:id` - Retrieve specific quest
- `POST /quests` - Create new quest
- `PUT /quests/:id` - Update quest
- `DELETE /quests/:id` - Delete quest
- `GET /quests/stats/rewards` - Get high-reward quests

## Usage Examples

### Adding Performance Monitoring to New Services

```typescript
// Using decorators for automatic monitoring
@MonitorQuery('SELECT', 'users', 100) // operation, table, threshold in ms
async getUsers(): Promise<User[]> {
  return await this.userRepository.find();
}

// Or using automatic detection
@AutoMonitorQuery(150) // Uses method name to infer operation/table
async findUserById(id: number): Promise<User> {
  return await this.userRepository.findOneBy({ id });
}
```

### Recording Custom Metrics

```typescript
// In your service
constructor(private performanceService: PerformanceService) {
  // Register a custom metric
  this.performanceService.registerCustomMetric('user_login_count', 'counter', {
    name: 'user_login_total',
    help: 'Total number of user logins',
    labelNames: ['provider'],
  });
}

// Record custom metric
recordUserLogin(provider: string) {
  this.performanceService.recordCustomMetric('user_login_count', { provider });
}
```

## Testing

### Unit Tests
- `src/performance/performance.service.spec.ts` - Tests for performance service functionality

### E2E Tests
- `test/performance.e2e-spec.ts` - End-to-end tests for metrics endpoints

Run tests:
```bash
npm run test
npm run test:e2e
```

## Monitoring Integration

### Prometheus Configuration
Add to your Prometheus config:

```yaml
scrape_configs:
  - job_name: 'quest-service'
    static_configs:
      - targets: ['quest-service:3004']
```

### Alerting Rules
Sample Prometheus alerting rules:

```yaml
groups:
- name: quest-service.rules
  rules:
  - alert: HighAPIResponseTime
    expr: histogram_quantile(0.95, rate(api_response_time_seconds_bucket[5m])) > 1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High API response time"
  
  - alert: MemoryLeakDetected
    expr: (process_resident_memory_bytes / process_heap_bytes) > 0.8
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Potential memory leak detected"
```

## Performance Impact

The monitoring adds minimal overhead:
- Interceptor overhead: ~1-2ms per request
- Metrics collection: Sub-millisecond operations
- Memory usage: Negligible increase for metrics storage

## Troubleshooting

### Common Issues
1. **Metrics not appearing**: Ensure the PerformanceInterceptor is registered globally
2. **High memory usage**: Check for memory leaks in application code, not monitoring
3. **Missing database metrics**: Verify that database services inject DatabaseMonitoringService

### Debugging
Enable debug logging to see performance monitoring details:
```bash
DEBUG=performance:* npm run start:dev
```

## Security Considerations

- Metrics endpoints may expose internal application information
- Consider restricting access to `/metrics` endpoint in production
- Sanitize sensitive data before recording custom metrics