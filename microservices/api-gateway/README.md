# API Gateway

A comprehensive API Gateway built with NestJS that provides routing, authentication, rate limiting, circuit breaking, and monitoring for microservices.

## Features

- **🚀 Service Routing**: Intelligent routing to 18+ microservices
- **🔐 JWT Authentication**: Global authentication with public endpoint support
- **⚡ Rate Limiting**: Configurable rate limiting with user-based differentiation
- **🔒 Circuit Breaker**: Prevents cascading failures with automatic recovery
- **⚖️ Load Balancing**: Round-robin load balancing with health checks
- **📊 Monitoring**: Comprehensive health checks and admin endpoints
- **📝 Logging**: Request/response logging with correlation IDs
- **🛡️ Security**: CORS, security headers, and input validation
- **🐳 Docker**: Ready-to-use Docker configuration

## Architecture

### Core Components

1. **Proxy Service**: Handles request forwarding and response handling
2. **Route Resolver**: Maps incoming requests to appropriate services
3. **Circuit Breaker**: Implements fault tolerance patterns
4. **Load Balancer**: Distributes traffic across healthy instances
5. **Authentication**: JWT-based authentication middleware
6. **Rate Limiter**: Prevents abuse with configurable limits
7. **Logger**: Structured logging with correlation tracking

### Supported Services

The gateway routes to the following microservices:

#### Core Services
- **Social Service** (`/api/social`) - User profiles and social features
- **Quest Service** (`/api/quest`) - Quest management and progression

#### Game Services
- **Achievement Service** (`/api/achievements`) - Achievement tracking
- **Game Session Service** (`/api/game-sessions`) - Active game sessions
- **Puzzle Service** (`/api/puzzles`) - Puzzle management and solving

#### Content Services
- **Content Service** (`/api/content`) - User-generated content and moderation

#### Economy Services
- **Economy Service** (`/api/economy`) - Virtual economy and transactions
- **Reward Service** (`/api/rewards`) - Reward distribution and tracking

#### Communication Services
- **Notification Service** (`/api/notifications`) - Push notifications and alerts
- **Email Service** (`/api/emails`) - Email communications

#### Tournament Services
- **Tournament Service** (`/api/tournaments`) - Tournament management
- **Matchmaking Service** (`/api/matchmaking`) - Player matchmaking

#### Analytics Services
- **Analytics Service** (`/api/analytics`) - Data analytics and reporting
- **Recommendation Service** (`/api/recommendations`) - Personalized recommendations

#### Infrastructure Services
- **Cache Service** (`/api/cache`) - Distributed caching
- **WebSocket Service** (`/api/websocket`) - Real-time communications
- **Moderation Service** (`/api/moderation`) - Content moderation
- **Replay Service** (`/api/replays`) - Game replay storage

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional)
- Redis (for rate limiting)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd microservices/api-gateway

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start in development mode
npm run start:dev
```

### Docker Setup

```bash
# Build the image
docker build -t api-gateway .

# Run the container
docker run -p 3000:3000 --env-file .env api-gateway
```

## Configuration

### Environment Variables

Key configuration options:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
RATE_LIMIT_MAX_AUTHENTICATED=200

# Circuit Breaker
CIRCUIT_BREAKER_TIMEOUT=5000
CIRCUIT_BREAKER_ERROR_THRESHOLD=50
CIRCUIT_BREAKER_RESET_TIMEOUT=30000

# Service URLs
SOCIAL_SERVICE_URL=http://localhost:3001
QUEST_SERVICE_URL=http://localhost:3002
# ... (see .env.example for complete list)
```

### Service Configuration

Each service can be configured with:

- `url`: Service base URL
- `prefix`: URL prefix for routing
- `healthPath`: Health check endpoint

## API Endpoints

### Public Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status with services
- `POST /auth/login` - Authentication endpoint

### Proxy Routes

All requests are proxied to appropriate services based on URL prefixes:

```
/api/social/*     → Social Service
/api/quest/*      → Quest Service
/api/achievements/* → Achievement Service
# ... etc
```

### Admin Endpoints

- `GET /admin/circuit-breakers` - All circuit breaker states
- `GET /admin/circuit-breakers/:service` - Specific service circuit breaker
- `POST /admin/circuit-breakers/:service/reset` - Reset circuit breaker
- `GET /admin/services` - All services status
- `GET /admin/services/:service/health` - Service health details
- `GET /admin/routes` - Routing configuration
- `GET /admin/config` - Gateway configuration

## Features in Detail

### Authentication

- JWT-based authentication with configurable expiration
- Public endpoint support via `@Public()` decorator
- User context propagation to downstream services
- Role-based access control support

### Rate Limiting

- IP-based limiting for anonymous users
- User-based limiting for authenticated users
- Configurable TTL and limits per endpoint
- Rate limit headers in responses

### Circuit Breaker

- Automatic failure detection
- Configurable thresholds and timeouts
- Fallback responses when services are unavailable
- Health monitoring and automatic recovery

### Load Balancing

- Round-robin algorithm
- Health check integration
- Instance availability tracking
- Automatic failover

### Logging

- Structured JSON logging
- Request/response correlation IDs
- Sanitized sensitive data
- Configurable log levels

## Monitoring

### Health Checks

The gateway provides comprehensive health monitoring:

- Basic health status
- Service availability
- Circuit breaker states
- Instance counts

### Metrics

- Request/response times
- Error rates
- Circuit breaker statistics
- Rate limiting metrics

## Security

### CORS Configuration

Configurable CORS with:
- Origin whitelisting
- Credential support
- Custom headers
- Method restrictions

### Security Headers

- Helmet.js integration
- XSS protection
- Content type sniffing protection
- Custom security policies

## Development

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run type-check
```

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure secure JWT secrets
3. Set up SSL/TLS certificates
4. Configure production service URLs
5. Set up monitoring and alerting

### Docker Production

```bash
# Build production image
docker build -f Dockerfile -t api-gateway:prod .

# Run with production settings
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name api-gateway \
  api-gateway:prod
```

### Scaling

- Horizontal scaling with load balancer
- Redis for distributed rate limiting
- Service discovery integration
- Health check monitoring

## Troubleshooting

### Common Issues

1. **Service Unavailable**: Check service URLs and health endpoints
2. **Circuit Breaker Open**: Monitor error rates and service health
3. **Rate Limit Exceeded**: Adjust limits or implement caching
4. **Authentication Failures**: Verify JWT configuration

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
LOG_FILE_ENABLED=true
```

### Health Monitoring

Monitor these endpoints:
- `/health` - Basic health
- `/health/detailed` - Service health
- `/admin/circuit-breakers` - Circuit breaker states

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

[Your License]
