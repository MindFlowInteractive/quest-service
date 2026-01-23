# Game Session Service

A microservice for managing active play sessions, state management, and puzzle replay functionality.

## Features

- **Session Lifecycle Management**: Create, update, pause, resume, complete, and abandon game sessions
- **State Snapshots**: Efficient state snapshot system with full, incremental, and checkpoint snapshots
- **Replay System**: Record and playback game sessions with move-by-move replay
- **Session Timeout Handling**: Automatic timeout handling for expired and inactive sessions
- **Redis Caching**: High-performance session caching with Redis
- **RESTful API**: Complete REST API for all session operations

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

### Running Locally

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Docker

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f game-session-service
```

## API Endpoints

### Sessions

- `POST /sessions` - Create a new session
- `GET /sessions/:sessionId` - Get session by ID
- `GET /sessions/user/:userId` - Get sessions by user ID
- `GET /sessions/user/:userId/active` - Get active session for user
- `PATCH /sessions/:sessionId` - Update session
- `POST /sessions/:sessionId/pause` - Pause session
- `POST /sessions/:sessionId/resume` - Resume session
- `POST /sessions/:sessionId/complete` - Complete session
- `POST /sessions/:sessionId/abandon` - Abandon session
- `DELETE /sessions/:sessionId` - Delete session

### State Snapshots

- `POST /state/snapshots` - Create a snapshot
- `GET /state/snapshots/session/:sessionId` - Get snapshots for session
- `GET /state/snapshots/session/:sessionId/latest` - Get latest snapshot
- `GET /state/snapshots/session/:sessionId/restore-points` - Get restore points
- `GET /state/snapshots/:snapshotId` - Get snapshot by ID
- `POST /state/snapshots/:snapshotId/restore` - Restore to snapshot
- `POST /state/snapshots/checkpoint` - Create checkpoint

### Replays

- `POST /replays/session/:sessionId/start` - Start recording
- `POST /replays/session/:sessionId/stop` - Stop recording
- `POST /replays/moves` - Record a move
- `POST /replays/snapshots` - Record a snapshot
- `GET /replays/session/:sessionId` - Get replay by session ID
- `GET /replays/:replayId` - Get replay by ID
- `GET /replays/user/:userId` - Get replays by user ID
- `POST /replays/:replayId/play` - Play replay
- `PATCH /replays/:replayId/metadata` - Update replay metadata
- `DELETE /replays/:replayId` - Delete replay

## Architecture

### Entities

- **Session**: Represents an active game session
- **StateSnapshot**: Stores game state at specific points in time
- **Replay**: Records and stores complete game replays

### Services

- **SessionService**: Manages session lifecycle
- **StateSnapshotService**: Handles state snapshots and restoration
- **ReplayService**: Manages replay recording and playback
- **RedisCacheService**: Provides Redis caching layer
- **TimeoutHandlerService**: Handles session timeouts via scheduled tasks

## Configuration

See `.env.example` for all configuration options.

### Key Environment Variables

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database configuration
- `REDIS_URL` - Redis connection URL
- `PORT` - Service port (default: 3004)
- `SESSION_TIMEOUT_SECONDS` - Session timeout in seconds
- `INACTIVE_THRESHOLD_SECONDS` - Inactive session threshold

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## License

UNLICENSED
