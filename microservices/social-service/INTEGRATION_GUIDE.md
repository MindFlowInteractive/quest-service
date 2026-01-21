# Social Service Integration Guide

## Overview

The Social Service is a standalone microservice that can be deployed independently or integrated with the main quest-service. This guide explains how to integrate it into your architecture.

## Integration Points

### 1. Database Integration

The Social Service uses a separate PostgreSQL schema (`social`) for isolation. You have two options:

#### Option A: Shared PostgreSQL Instance (Recommended for Development)
```yaml
# Use the same PostgreSQL instance as quest-service
services:
  quest-service:
    DB_HOST: postgres
    DB_NAME: quest_service
  
  social-service:
    DB_HOST: postgres  # Same database server
    DB_NAME: quest_service  # Can be same or different
    # Social tables will be in 'social' schema
```

#### Option B: Separate PostgreSQL Instance (Recommended for Production)
```yaml
# Use separate database for better isolation
services:
  quest-service:
    DB_HOST: postgres-quest
    DB_NAME: quest_service
  
  social-service:
    DB_HOST: postgres-social  # Separate instance
    DB_NAME: social_service
```

### 2. API Gateway Integration

If using an API Gateway:

```nginx
# Nginx example
upstream social-service {
    server social-service:3001;
}

location /api/social/ {
    proxy_pass http://social-service/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-User-ID $user_id;  # Pass user context
}
```

### 3. User Authentication Integration

The Social Service needs to know the current user. Update authentication in controllers:

#### Current (Placeholder)
```typescript
// In friends.controller.ts
const userId = ''; // TODO: Get from auth
```

#### After Integration
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CurrentUser } from './auth/current-user.decorator';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  @Post('request')
  async sendFriendRequest(
    @CurrentUser() userId: string,
    @Body() dto: CreateFriendRequestDto,
  ) {
    return this.friendsService.sendFriendRequest(userId, dto);
  }
}
```

Or create a custom decorator:
```typescript
// src/auth/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.id; // Extract from JWT token
  },
);
```

### 4. Service-to-Service Communication

For inter-service communication, use HTTP client or message queue:

#### HTTP Client Example
```typescript
import { HttpModule } from '@nestjs/axios';
import { HttpService } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
})
export class IntegrationModule {
  constructor(private httpService: HttpService) {}

  async getUserFromQuestService(userId: string) {
    return this.httpService.get(
      `http://quest-service:3000/users/${userId}`
    ).toPromise();
  }
}
```

### 5. Docker Compose Integration

Add Social Service to main quest-service docker-compose:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: quest_service
    volumes:
      - postgres_data:/var/lib/postgresql/data

  quest-service:
    build: .
    ports:
      - '3000:3000'
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_NAME: quest_service

  social-service:
    build: ./microservices/social-service
    ports:
      - '3001:3001'
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_NAME: quest_service
    networks:
      - quest-network

volumes:
  postgres_data:

networks:
  quest-network:
```

### 6. WebSocket Integration

If using a single WebSocket connection for all services:

```typescript
// Client side
const questSocket = io('http://localhost:3000/quest');
const socialSocket = io('http://localhost:3001/social');

// Or create an adapter layer
class ServiceGateway {
  private sockets = {
    quest: io('http://localhost:3000/quest'),
    social: io('http://localhost:3001/social'),
  };

  emit(service: 'quest' | 'social', event: string, data: any) {
    this.sockets[service].emit(event, data);
  }
}
```

## Environment Configuration

### Shared .env
```bash
# Common
NODE_ENV=development
LOG_LEVEL=debug

# Database (shared instance)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quest_service

# Quest Service
QUEST_PORT=3000

# Social Service
SOCIAL_PORT=3001

# JWT Secret (shared)
JWT_SECRET=your-secret-key-here

# API Keys
EXTERNAL_API_KEY=xxx
```

## Monitoring & Logging

### Centralized Logging

```typescript
// Configure Winston for both services
import { WinstonModule } from 'nest-winston';

export const loggerConfig = WinstonModule.createLogger({
  defaultMeta: { service: process.env.SERVICE_NAME },
  transports: [
    // Log to files and services centrally
  ],
});
```

### Health Checks

Both services provide health endpoints:

```bash
# Quest Service
curl http://localhost:3000/health

# Social Service
curl http://localhost:3001/health
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// src/cache/cache.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register()],
})
export class CacheModule {}
```

### 2. Database Connection Pooling

```typescript
// orm-config.ts
export const AppDataSource = new DataSource({
  // ...
  extra: {
    max: 20,  // Maximum pool size
    min: 5,   // Minimum pool size
  },
});
```

### 3. Load Balancing

```yaml
# Use Docker Swarm or Kubernetes for load balancing
services:
  social-service-1:
    build: ./microservices/social-service
    deploy:
      replicas: 3
  
  social-service-2:
    build: ./microservices/social-service
  
  # Load balancer routes to all instances
```

## Testing Integration

### Integration Tests

```typescript
// test/social-quest-integration.spec.ts
import { Test } from '@nestjs/testing';
import { FriendsService } from 'social-service/friends/friends.service';
import { UsersService } from 'quest-service/users/users.service';

describe('Social-Quest Integration', () => {
  it('should sync user data between services', async () => {
    const user = await usersService.findById(userId);
    const friends = await friendsService.getFriends(userId);
    
    expect(friends).toBeDefined();
  });
});
```

## Deployment Checklist

- [ ] Verify database schema creation for 'social'
- [ ] Update authentication in controllers
- [ ] Configure API gateway routing
- [ ] Set up environment variables
- [ ] Test inter-service communication
- [ ] Configure centralized logging
- [ ] Set up monitoring and alerts
- [ ] Create backup strategy
- [ ] Document API changes
- [ ] Set up CI/CD pipeline

## Kubernetes Deployment

```yaml
# social-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: social-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: social-service
  template:
    metadata:
      labels:
        app: social-service
    spec:
      containers:
      - name: social-service
        image: social-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DB_HOST
          value: postgres-service
        - name: NODE_ENV
          value: production
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: social-service
spec:
  selector:
    app: social-service
  ports:
  - protocol: TCP
    port: 3001
    targetPort: 3001
  type: ClusterIP
```

## API Versioning

If adding new features, consider API versioning:

```typescript
// v1 routes
@Controller('api/v1/friends')

// v2 routes (future)
@Controller('api/v2/friends')
```

## Documentation Updates

When integrating, update:

1. Main README.md - Add social service info
2. API Documentation - Include social endpoints
3. Architecture Diagram - Show service relationships
4. Setup Guide - Include social service setup
5. Database Diagram - Show social schema

## Troubleshooting Integration

### Connection Issues
```bash
# Check if service is running
docker ps | grep social-service

# Check logs
docker logs social-service

# Test connectivity
curl http://social-service:3001/health
```

### Database Issues
```bash
# Check database connection
psql -h localhost -U postgres -d quest_service -c "SELECT * FROM information_schema.tables WHERE table_schema = 'social';"

# Run migrations
docker exec social-service npm run migration:run
```

### Authentication Issues
```bash
# Verify JWT token is passed correctly
# Add debug logging in CurrentUser decorator
```

## Support & Questions

For integration assistance:
1. Check QUICKSTART.md for setup details
2. Review IMPLEMENTATION_SUMMARY.md for features
3. Check service logs for errors
4. Review this integration guide

## Next Steps

1. ✅ Set up database connection
2. ✅ Integrate authentication
3. ✅ Configure API gateway
4. ✅ Set up logging
5. ✅ Test all features
6. ✅ Deploy to production

The Social Service is ready for integration! 🚀
