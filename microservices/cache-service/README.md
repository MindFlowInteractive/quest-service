# Cache Service

Lightweight NestJS-based distributed caching microservice using Redis with TTLs, cache-aside pattern, and distributed locks.

## Quick Start (Development)

```bash
cd microservices/cache-service
cp .env.example .env
npm install
npm run start:dev
```

## Docker (Recommended)

```bash
cd microservices/cache-service
docker compose up --build
```

Starts:
- Redis on `localhost:6379` (with LRU eviction, 128MB limit)
- Cache service on `localhost:3000`

## Production Deployment

Set environment variables:
- `REDIS_URL` - Redis connection string (default: `redis://redis:6379`)
- `NODE_ENV` - `production` for optimized retry/logging (default: `development`)
- `PORT` - Server port (default: `3000`)
- `LOG_LEVEL` - Logging level: `log`, `warn`, `error` (default: all)

Example:
```bash
NODE_ENV=production \
REDIS_URL=redis://redis-cluster:6379 \
PORT=3000 \
npm start
```

## API Endpoints

### Cache Operations
- `GET /api/cache/:key` - Fetch key or compute via demo function
- `POST /api/cache/warm` - Warm cache with list of keys (`{ keys: string[], ttl?: number }`)
- `POST /api/cache/invalidate` - Invalidate by key or pattern (`{ key?: string } | { pattern?: string }`)
- `GET /api/cache/stats` - Returns `{ hits: number, misses: number }`

### Lock Operations
- `POST /api/cache/lock/acquire` - Acquire lock (`{ resource: string, ttl?: number }`)
- `POST /api/cache/lock/release` - Release lock (`{ key: string, token: string }`)

## Testing

### Unit Tests
```bash
npm test -- src/cache/cache.service.spec.ts
npm test -- src/cache/cache.controller.spec.ts
```

### Integration Tests (Bash)
```bash
./integration-test.sh
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Key Features

- **Cache-Aside Pattern**: `getOrSet(key, fetchFn, ttl)` with JSON serialization
- **TTL Support**: Configurable per-key expiration using Redis `EX` option
- **Invalidation**: Single-key or pattern-based (using `SCAN` to avoid blocking)
- **Cache Warming**: Bulk populate cache from async fetchFn
- **Distributed Locks**: Token-based via Lua scripts; prevents race conditions
- **Stats Tracking**: Hit/miss counters via Redis increments
- **Production Ready**: Configurable retry strategies, graceful connection handling

## Architecture

- **Client**: `ioredis` (5.3.2+) with production retry logic
- **Framework**: NestJS 10 with Express
- **Locks**: Redis Lua-based (SET NX PX, atomic delete on release)
- **Docker**: Alpine-based Node image, Docker Compose with Redis 7

## Configuration Details

### Redis Connection (Production)
- Exponential backoff retry: `delay = min(attempts * 50ms, 2000ms)`
- Max retries: 20 (production) / 3 (development)
- Ready check enabled
- Offline queue enabled

### Cache LRU Eviction (Docker Compose)
- Max memory: 128MB
- Policy: `allkeys-lru` (evict least-recently-used keys on memory pressure)

## Notes

- Lock implementation is intentionally lightweight without external Redlock library
- For enterprise use, consider adopting Redlock (https://redis.io/topics/distlock) or a managed Redis cluster with ACLs
- Admin/debug endpoints removed for production
- All test files use `redis://localhost:6379`; adjust `REDIS_URL` for other environments
