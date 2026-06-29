# Skill Assessment Service

A microservice for evaluating player abilities and placing them in appropriate difficulty tiers.

## Features

- **Skill Assessment System**: Comprehensive evaluation of player abilities through adaptive testing
- **Adaptive Difficulty**: Dynamic difficulty adjustment based on player performance
- **Skill Tier Assignment**: Automatic placement into appropriate difficulty tiers (Bronze, Silver, Gold, Platinum, Diamond)
- **Periodic Reassessment**: Scheduled re-evaluation of player skills
- **Skill Trajectory Analysis**: Tracking and analyzing skill progression over time
- **Assessment Analytics**: Detailed analytics and reporting on assessment data
- **Skill Gap Identification**: Identification of areas where players need improvement

## Installation

```bash
npm install
```

## Running the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Swagger documentation is available at `http://localhost:3015/api` when running the service.

## Environment Variables

See `.env.example` for the required environment variables.

## Database

The service uses PostgreSQL. Ensure the database is running before starting the service.

## Docker

```bash
docker-compose up
```

## Testing

```bash
npm run test
npm run test:cov
```
