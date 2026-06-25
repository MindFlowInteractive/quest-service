# Cache Warming Service

Independent NestJS service that proactively warms Redis with popular Quest Service data.

## What It Does

- Tracks preload candidates in Postgres with popularity, priority, TTL, and time-of-day windows.
- Warms Redis on a schedule and skips keys that still have healthy TTL.
- Raises priority for missed keys and runs hit-rate optimization.
- Schedules immediate, delayed, repeating, and per-entry invalidation.
- Persists warming jobs and metric samples for monitoring.

## Run Locally

```bash
cp .env.example .env
npm install
npm run start:dev
```

Or run the service with its local Postgres and Redis:

```bash
docker-compose up --build
```

## Useful Endpoints

- `GET /api/health`
- `GET /api/cache-warming/dashboard`
- `POST /api/cache-warming/preload-data`
- `POST /api/cache-warming/access`
- `POST /api/cache-warming/warm`
- `POST /api/cache-warming/invalidate`
- `POST /api/cache-warming/invalidate/schedule`
- `POST /api/cache-warming/optimize`
- `GET /api/cache-warming/jobs`
- `GET /api/cache-warming/metrics`
