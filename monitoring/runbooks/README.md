# Quest Service Monitoring Runbooks

## Table of Contents

1. [Service Down Alert](#service-down-alert)
2. [High Error Rate Alert](#high-error-rate-alert)
3. [High Response Time Alert](#high-response-time-alert)
4. [High Memory Usage Alert](#high-memory-usage-alert)
5. [High CPU Usage Alert](#high-cpu-usage-alert)
6. [Database Connection Issues](#database-connection-issues)
7. [Redis Memory Issues](#redis-memory-issues)
8. [Low Disk Space Alert](#low-disk-space-alert)
9. [Game Session Timeouts](#game-session-timeouts)
10. [Economy Transaction Failures](#economy-transaction-failures)

---

## Service Down Alert

### Symptoms
- Service shows as DOWN in Grafana dashboard
- Health checks failing
- Users unable to access specific functionality

### Possible Causes
- Service crash
- Network connectivity issues
- Resource exhaustion
- Deployment issues

### Troubleshooting Steps

1. **Check Service Status**
   ```bash
   docker ps | grep quest-service
   docker logs quest-service --tail=100
   ```

2. **Check Resource Usage**
   ```bash
   docker stats quest-service
   ```

3. **Check Network Connectivity**
   ```bash
   curl -f http://localhost:3000/health || echo "Service unreachable"
   ```

4. **Restart Service if Needed**
   ```bash
   docker restart quest-service
   ```

5. **Check Dependencies**
   - Database connectivity
   - Redis connectivity
   - External API status

### Prevention
- Set up proper health checks
- Monitor resource usage
- Implement circuit breakers for external dependencies

---

## High Error Rate Alert

### Symptoms
- Error rate > 10% for sustained period
- 5xx responses increasing
- User complaints about errors

### Possible Causes
- Code bugs
- Database issues
- External service failures
- Resource constraints

### Troubleshooting Steps

1. **Check Error Logs**
   ```bash
   docker logs quest-service | grep ERROR | tail -50
   ```

2. **Analyze Error Patterns**
   - Check Kibana for error patterns
   - Look for recent deployments
   - Check database query performance

3. **Check Dependencies**
   ```bash
   # Database
   docker exec -it postgres pg_isready -U postgres
   
   # Redis
   docker exec -it redis redis-cli ping
   ```

4. **Rollback Recent Changes**
   - If recent deployment, consider rollback
   - Check feature flags

### Prevention
- Implement comprehensive error handling
- Add proper logging
- Use canary deployments
- Set up automated testing

---

## High Response Time Alert

### Symptoms
- 95th percentile response time > 1 second
- User complaints about slowness
- Timeouts occurring

### Possible Causes
- Database performance issues
- Resource contention
- Inefficient queries
- Network latency

### Troubleshooting Steps

1. **Check Database Performance**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

2. **Check Resource Usage**
   ```bash
   docker stats
   top
   ```

3. **Analyze Application Logs**
   - Look for timeout errors
   - Check for database connection pool issues

4. **Profile Application**
   - Use APM tools
   - Check for memory leaks
   - Analyze garbage collection

### Prevention
- Implement caching strategies
- Optimize database queries
- Use connection pooling
- Monitor and optimize regularly

---

## High Memory Usage Alert

### Symptoms
- Memory usage > 90% for sustained period
- Service becoming unresponsive
- Out-of-memory errors

### Possible Causes
- Memory leaks
- Increased traffic
- Inefficient code
- Large data processing

### Troubleshooting Steps

1. **Check Memory Usage**
   ```bash
   free -h
   docker stats quest-service
   ```

2. **Analyze Memory Patterns**
   ```bash
   # Check for memory leaks
   docker logs quest-service | grep -i "out of memory"
   ```

3. **Check Application Metrics**
   - Monitor heap usage in Grafana
   - Look for memory growth patterns

4. **Restart Service if Needed**
   ```bash
   docker restart quest-service
   ```

### Prevention
- Implement memory monitoring
- Use memory profiling tools
- Optimize data structures
- Set appropriate memory limits

---

## High CPU Usage Alert

### Symptoms
- CPU usage > 80% for sustained period
- System becoming sluggish
- Response times increasing

### Possible Causes
- High traffic volume
- CPU-intensive operations
- Inefficient algorithms
- Infinite loops

### Troubleshooting Steps

1. **Check CPU Usage**
   ```bash
   top
   docker stats quest-service
   ```

2. **Identify CPU-Intensive Processes**
   ```bash
   ps aux | sort -rk 3 | head -10
   ```

3. **Analyze Application Performance**
   - Check for infinite loops
   - Profile CPU usage
   - Review recent code changes

### Prevention
- Implement CPU monitoring
- Use efficient algorithms
- Scale horizontally when needed
- Implement rate limiting

---

## Database Connection Issues

### Symptoms
- High number of active connections
- Connection timeouts
- Database errors in logs

### Possible Causes
- Connection leaks
- High query load
- Database performance issues
- Network problems

### Troubleshooting Steps

1. **Check Connection Count**
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

2. **Check Long-Running Queries**
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state = 'active' 
   ORDER BY duration DESC;
   ```

3. **Check Database Performance**
   ```bash
   docker exec -it postgres psql -U postgres -c "SELECT * FROM pg_stat_database;"
   ```

### Prevention
- Implement connection pooling
- Monitor query performance
- Set connection limits
- Regular database maintenance

---

## Redis Memory Issues

### Symptoms
- Redis memory usage > 90%
- Redis evictions increasing
- Cache performance degradation

### Possible Causes
- Memory leaks
- Large cached objects
- Insufficient memory limits
- Too many keys

### Troubleshooting Steps

1. **Check Redis Memory Usage**
   ```bash
   docker exec -it redis redis-cli info memory
   ```

2. **Analyze Memory Usage**
   ```bash
   docker exec -it redis redis-cli memory usage <key>
   ```

3. **Check for Memory Leaks**
   - Monitor key count over time
   - Check for expired keys not being cleaned

### Prevention
- Set appropriate memory limits
- Implement key expiration
- Monitor memory usage patterns
- Use Redis clustering if needed

---

## Low Disk Space Alert

### Symptoms
- Disk usage < 10% available
- Write errors in logs
- Service failures

### Possible Causes
- Log files accumulating
- Database growth
- Temporary files not cleaned
- Backup files

### Troubleshooting Steps

1. **Check Disk Usage**
   ```bash
   df -h
   du -sh /var/log/*
   ```

2. **Clean Up Log Files**
   ```bash
   # Clean old logs
   find /var/log -name "*.log" -mtime +7 -delete
   
   # Clean docker logs
   docker system prune -f
   ```

3. **Check Database Size**
   ```bash
   docker exec -it postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('quest_db'));"
   ```

### Prevention
- Implement log rotation
- Set up automated cleanup
- Monitor disk usage trends
- Plan capacity accordingly

---

## Game Session Timeouts

### Symptoms
- High session timeout rate
- Users losing game progress
- Complaints about session issues

### Possible Causes
- Redis connectivity issues
- Session management bugs
- Network timeouts
- Resource constraints

### Troubleshooting Steps

1. **Check Session Logs**
   ```bash
   docker logs game-session-service | grep -i timeout | tail -20
   ```

2. **Check Redis Connectivity**
   ```bash
   docker exec -it redis redis-cli ping
   ```

3. **Analyze Session Patterns**
   - Check for specific timeout patterns
   - Look for correlation with system load

### Prevention
- Implement proper session management
- Add session heartbeat mechanism
- Monitor session health
- Implement session recovery

---

## Economy Transaction Failures

### Symptoms
- High transaction failure rate
- Users losing currency/items
- Payment processing issues

### Possible Causes
- Database transaction conflicts
- Payment gateway issues
- Insufficient funds
- Race conditions

### Troubleshooting Steps

1. **Check Transaction Logs**
   ```bash
   docker logs economy-service | grep -i "transaction.*fail" | tail -20
   ```

2. **Check Database Integrity**
   ```sql
   -- Check for orphaned transactions
   SELECT * FROM economy_transactions WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';
   ```

3. **Verify Payment Gateway**
   - Check external payment service status
   - Verify API credentials
   - Test payment flow

### Prevention
- Implement proper transaction handling
- Add retry mechanisms
- Use database transactions properly
- Implement audit logging

---

## Emergency Contacts

- **DevOps Team**: devops@quest-service.com
- **Development Team**: dev@quest-service.com
- **On-call Engineer**: +1-555-0123

## Escalation Procedures

1. **Level 1**: Automated alerts, basic troubleshooting
2. **Level 2**: DevOps team notification (5 minutes)
3. **Level 3**: Development team notification (15 minutes)
4. **Level 4**: Management notification (30 minutes)

## Communication Templates

### Service Outage Template
```
Subject: [OUTAGE] Quest Service - [Service Name] Down

Status: INVESTIGATING
Impact: Users experiencing [specific impact]
Started: [timestamp]
Next Update: [timestamp + 15 min]

Details:
[Brief description of issue]

Actions:
[Current troubleshooting steps]
```

### Resolution Template
```
Subject: [RESOLVED] Quest Service - [Service Name] Restored

Status: RESOLVED
Duration: [total outage time]
Impact: [affected users/services]

Root Cause:
[Final analysis of issue]

Preventive Measures:
[Steps to prevent recurrence]
```
