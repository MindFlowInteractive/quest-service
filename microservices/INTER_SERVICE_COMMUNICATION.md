# Inter-Service Communication Documentation

## Overview

This document describes the professional inter-service communication system implemented for the Quest Service microservices architecture. The system provides both asynchronous event-driven communication and synchronous gRPC calls, with built-in retry mechanisms, dead letter queues, and service discovery.

## Architecture

### Components

1. **Message Brokers**: RabbitMQ and Redis for asynchronous communication
2. **Event Bus**: Central event publishing and subscription system
3. **gRPC**: Synchronous service-to-service communication
4. **Service Discovery**: Automatic service registration and discovery
5. **Shared Library**: Common communication patterns and utilities

## Message Brokers

### RabbitMQ Configuration

- **Exchange**: Topic-based routing for flexible event distribution
- **Queues**: Durable queues with dead letter exchange (DLQ) configuration
- **Retry Logic**: Exponential backoff with jitter
- **Health Checks**: Built-in connection monitoring

### Redis/BullMQ Configuration

- **Job Queues**: Persistent job processing with priority support
- **Workers**: Concurrent processing with rate limiting
- **Dead Letter Queues**: Automatic failed job routing
- **Job Scheduling**: Delayed and recurring job support

## Event-Driven Communication

### Event Types

```typescript
// User Events
UserRegisteredEvent
UserUpdatedEvent

// Game Events
PuzzleCompletedEvent
AchievementUnlockedEvent

// Social Events
FriendRequestSentEvent
FriendRequestAcceptedEvent

// Tournament Events
TournamentStartedEvent
TournamentEndedEvent

// Notification Events
NotificationCreatedEvent
```

### Publishing Events

```typescript
import { EventPublisherService } from '@quest-service/shared';

@Injectable()
export class UserService {
  constructor(private readonly eventPublisher: EventPublisherService) {}

  async registerUser(userData: any) {
    const user = await this.createUser(userData);
    
    // Publish event
    await this.eventPublisher.publishEvent(
      'UserRegistered',
      { userId: user.id, email: user.email, username: user.username },
      'user-service'
    );
    
    return user;
  }
}
```

### Handling Events

```typescript
import { IEventHandler, UserRegisteredEvent } from '@quest-service/shared';

@Injectable()
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  async handle(event: UserRegisteredEvent): Promise<void> {
    console.log('Handling UserRegistered event:', event);
    // Process event logic
    await this.sendWelcomeNotification(event.data.userId, event.data.email);
  }
}
```

## gRPC Communication

### Protocol Buffers

#### Social Service (social.proto)

```protobuf
service SocialService {
  rpc GetFriends(GetFriendsRequest) returns (GetFriendsResponse);
  rpc SendFriendRequest(FriendRequestRequest) returns (FriendRequestResponse);
  rpc GetLeaderboard(GetLeaderboardRequest) returns (GetLeaderboardResponse);
}
```

#### Notification Service (notification.proto)

```protobuf
service NotificationService {
  rpc SendNotification(SendNotificationRequest) returns (SendNotificationResponse);
  rpc GetNotifications(GetNotificationsRequest) returns (GetNotificationsResponse);
  rpc SubscribeToUpdates(SubscribeRequest) returns (stream NotificationUpdate);
}
```

### Client Usage

```typescript
import { GrpcClientService } from '@quest-service/shared';

@Injectable()
export class NotificationService {
  constructor(private readonly grpcClient: GrpcClientService) {}

  async sendNotification(notificationData: any) {
    const client = this.grpcClient.getClient('notification-service');
    
    const request = {
      user_id: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
    };

    return this.grpcClient.callWithTimeout(
      client,
      'sendNotification',
      request,
      5000
    );
  }
}
```

## Service Discovery

### Service Registration

Services automatically register themselves on startup:

```typescript
@Injectable()
export class ServiceRegistrationService implements OnModuleInit {
  async onModuleInit() {
    await this.registerService();
  }

  private async registerService() {
    this.serviceId = await this.serviceRegistry.registerService(
      'notification-service',
      'localhost',
      3000,
      'http',
      {
        version: '1.0.0',
        environment: 'development',
      }
    );
  }
}
```

### Service Discovery

```typescript
@Injectable()
export class ServiceClient {
  async getSocialServiceUrl(): Promise<string> {
    return await this.serviceRegistry.getServiceUrl('social-service', 'grpc');
  }

  async getHealthyNotificationService(): Promise<ServiceInfo> {
    return await this.serviceRegistry.getHealthyService('notification-service');
  }
}
```

## Retry Logic and Error Handling

### Configuration

```typescript
// RabbitMQ Retry Configuration
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

// Dead Letter Queue Configuration
const deadLetterConfig = {
  enabled: true,
  exchange: 'dlq.exchange',
  routingKey: 'dlq.routing.key',
  ttl: 86400000, // 24 hours
};
```

### Retry Behavior

1. **Automatic Retries**: Failed messages are automatically retried with exponential backoff
2. **Dead Letter Queue**: Messages exceeding max retries are moved to DLQ
3. **Monitoring**: Failed events are logged and can be reprocessed manually
4. **Circuit Breaker**: Services can stop processing if failure rate is too high

## Environment Configuration

### Required Environment Variables

```bash
# Message Brokers
RABBITMQ_URL=amqp://admin:rabbitmq123@localhost:5672
REDIS_URL=redis://:redis123@localhost:6379

# Service Configuration
SERVICE_NAME=notification-service
SERVICE_HOST=localhost
SERVICE_PORT=3000
SERVICE_PROTOCOL=http
SERVICE_VERSION=1.0.0

# Retry Configuration
RABBITMQ_MAX_RETRIES=3
RABBITMQ_INITIAL_DELAY=1000
RABBITMQ_MAX_DELAY=30000

# Dead Letter Queue
RABBITMQ_DLQ_ENABLED=true
RABBITMQ_DLQ_EXCHANGE=dlq.exchange
RABBITMQ_DLQ_ROUTING_KEY=dlq.routing.key
```

## Usage Examples

### Complete Event Flow

1. **User Registration**:
   - User service publishes `UserRegisteredEvent`
   - Notification service handles event and sends welcome email
   - Social service handles event and creates user profile

2. **Puzzle Completion**:
   - Game service publishes `PuzzleCompletedEvent`
   - Social service updates user score and leaderboard
   - Notification service sends achievement notification

3. **Friend Request**:
   - Social service publishes `FriendRequestSentEvent`
   - Notification service sends friend request notification
   - Real-time WebSocket updates sent to recipient

### gRPC Service Call

```typescript
// Get user's friends from social service
const socialClient = grpcClient.getClient('social-service');
const response = await grpcClient.callWithTimeout(
  socialClient,
  'getFriends',
  { user_id: '123', page: 1, limit: 10 }
);
```

## Monitoring and Observability

### Health Checks

All services expose health check endpoints:
- `/health` - Basic service health
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

### Metrics

- Message processing rates
- Error rates and retry counts
- gRPC request/response times
- Service discovery status

### Logging

Structured logging includes:
- Correlation IDs for request tracing
- Event metadata for debugging
- Error details with stack traces

## Best Practices

### Event Design

1. **Immutable Events**: Events should be immutable facts
2. **Schema Versioning**: Include version in event types
3. **Idempotency**: Handlers should be idempotent
4. **Correlation IDs**: Track request flow across services

### Error Handling

1. **Graceful Degradation**: Services should function with partial failures
2. **Timeout Management**: Set appropriate timeouts for gRPC calls
3. **Circuit Breakers**: Prevent cascading failures
4. **Dead Letter Processing**: Monitor and reprocess DLQ messages

### Performance

1. **Batch Processing**: Process events in batches when possible
2. **Connection Pooling**: Reuse connections to message brokers
3. **Async Processing**: Use non-blocking operations
4. **Caching**: Cache frequently accessed service locations

## Deployment

### Docker Compose

The system includes:
- RabbitMQ with management UI
- Redis with persistence
- PostgreSQL databases
- Application services

### Scaling

1. **Horizontal Scaling**: Multiple instances of each service
2. **Load Balancing**: Round-robin service discovery
3. **Partition Tolerance**: Handle network partitions gracefully
4. **Consistency**: Eventually consistent event processing

## Troubleshooting

### Common Issues

1. **Message Not Delivered**: Check service registration and queue bindings
2. **High Retry Rates**: Check for configuration issues or downstream failures
3. **Service Discovery Failures**: Verify Redis connectivity
4. **gRPC Timeouts**: Check network connectivity and service health

### Debugging Tools

1. **RabbitMQ Management UI**: Monitor queues and exchanges
2. **Redis CLI**: Inspect queues and job status
3. **Service Registry**: List registered services
4. **Event Store**: Query event history

This comprehensive inter-service communication system provides a robust foundation for scalable microservices with proper error handling, monitoring, and observability.
