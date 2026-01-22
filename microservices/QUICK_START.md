# Quick Start Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- npm or yarn

## Setup

1. **Start Infrastructure Services**:
```bash
cd /Users/apple/Desktop/quest-service
docker-compose up -d postgres redis rabbitmq
```

2. **Install Dependencies**:
```bash
# Shared library
cd microservices/shared
npm install
npm run build

# Notification service
cd ../notification-service
npm install
cp .env.example .env
# Update .env with your configuration

# Social service
cd ../social-service
npm install
cp .env.example .env
# Update .env with your configuration
```

3. **Start Services**:
```bash
# Notification service
cd microservices/notification-service
npm run start:dev

# Social service (in another terminal)
cd microservices/social-service
npm run start:dev
```

## Verify Setup

1. **RabbitMQ Management UI**: http://localhost:15672 (admin/rabbitmq123)
2. **Redis CLI**: `redis-cli -h localhost -p 6379 -a redis123`
3. **Service Health**: 
   - http://localhost:3000/health (notification)
   - http://localhost:3001/health (social)

## Test Communication

1. **Publish Event**:
```bash
curl -X POST http://localhost:3000/test/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "UserRegistered",
    "data": {
      "userId": "123",
      "email": "test@example.com",
      "username": "testuser"
    }
  }'
```

2. **Check Service Discovery**:
```bash
curl http://localhost:3000/services
```

## Next Steps

- Read the [Inter-Service Communication Documentation](./INTER_SERVICE_COMMUNICATION.md)
- Configure your own events and handlers
- Set up monitoring and observability
- Deploy to production environment
