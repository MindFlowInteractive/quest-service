# Social Service - Production Ready README

## Overview

The Social Service is a NestJS microservice that manages:
- **Friend System**: Bidirectional friend requests and relationships
- **Leaderboards**: Player rankings with score calculations and seasonality
- **Multiplayer Rooms**: Real-time multiplayer game session management
- **WebSocket**: Real-time communication for all social features

## Project Structure

```
social-service/
├── src/
│   ├── config/              # Database and app configuration
│   ├── common/
│   │   └── gateways/        # WebSocket gateway
│   ├── friends/             # Friend system module
│   │   ├── dto/
│   │   ├── friend.entity.ts
│   │   ├── friend-request.entity.ts
│   │   ├── friends.service.ts
│   │   ├── friends.controller.ts
│   │   └── friends.module.ts
│   ├── leaderboards/        # Leaderboard module
│   │   ├── dto/
│   │   ├── leaderboard-entry.entity.ts
│   │   ├── leaderboards.service.ts
│   │   ├── leaderboards.controller.ts
│   │   └── leaderboards.module.ts
│   ├── rooms/               # Multiplayer rooms module
│   │   ├── dto/
│   │   ├── multiplayer-room.entity.ts
│   │   ├── rooms.service.ts
│   │   ├── rooms.controller.ts
│   │   └── rooms.module.ts
│   ├── database/
│   │   └── migrations/      # TypeORM migrations
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
├── test/
├── docker/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env.example
└── ormconfig.ts
```

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Features

### 1. Friend System

**Bidirectional Friend Requests**
- Send friend requests
- Accept/decline requests
- Block/unblock users
- Add friend nicknames
- Check friendship status

**API Endpoints**
- `POST /friends/request` - Send friend request
- `GET /friends/requests/pending` - Get pending requests
- `POST /friends/requests/:id/accept` - Accept request
- `POST /friends/requests/:id/decline` - Decline request
- `GET /friends` - Get all friends
- `PATCH /friends/:friendId/nickname` - Update nickname
- `POST /friends/:friendId/block` - Block friend
- `DELETE /friends/:friendId` - Remove friend

### 2. Leaderboard System

**Ranking Logic**
- Automatic rank calculation based on scores
- Per-season leaderboards
- Win/loss tracking
- Win rate calculation

**Features**
- Top N players ranking
- Player rank with context (nearby players)
- Season statistics
- Score updates and point tracking

**API Endpoints**
- `POST /leaderboards` - Create entry
- `GET /leaderboards/top` - Get top players
- `GET /leaderboards/season/:seasonId` - Get paginated leaderboard
- `GET /leaderboards/user/:userId` - Get user entry
- `GET /leaderboards/user/:userId/rank` - Get rank with context
- `POST /leaderboards/user/:userId/win` - Record win
- `POST /leaderboards/user/:userId/loss` - Record loss
- `POST /leaderboards/user/:userId/add-score` - Add points

### 3. Multiplayer Rooms

**Room Management**
- Create public/private rooms
- Password-protected rooms
- Room status tracking (waiting, in_progress, completed, cancelled)
- Participant management
- Puzzle association

**Features**
- Join/leave rooms
- Start/complete games
- Room metadata
- Owner controls

**API Endpoints**
- `POST /rooms` - Create room
- `GET /rooms` - Get available rooms
- `GET /rooms/:roomId` - Get room details
- `POST /rooms/:roomId/join` - Join room
- `POST /rooms/:roomId/leave` - Leave room
- `POST /rooms/:roomId/start` - Start game
- `POST /rooms/:roomId/complete` - Complete game
- `PATCH /rooms/:roomId` - Update room details

### 4. WebSocket (Real-Time Features)

**Events**
- `room-join` / `room-leave` - Room participation
- `room-message` - Chat in rooms
- `game-start` / `game-complete` - Game lifecycle
- `leaderboard-update` - Score updates
- `friend-request` - Friend request notifications
- `friend-status` - Online/offline status
- `room-invite` - Room invitations
- `typing-indicator` - Typing notifications

## Database Schema

The service uses a separate PostgreSQL schema called `social` with the following tables:

- **friends**: Bidirectional friend relationships
- **friend_requests**: Pending/accepted/declined requests
- **leaderboard_entries**: Player scores and rankings per season
- **multiplayer_rooms**: Game session data

See [SCHEMA.md](src/database/SCHEMA.md) for detailed schema documentation.

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=quest_service

# WebSocket
WEBSOCKET_PORT=3001
WEBSOCKET_CORS=*

# Logging
LOG_LEVEL=debug
```

## Testing

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## Docker

```bash
# Build Docker image
docker build -f docker/Dockerfile -t social-service:latest .

# Run in Docker
docker run -p 3001:3001 --env-file .env social-service:latest
```

## API Documentation

### Authentication

**Note**: Currently, authentication is not enforced. In production, implement JWT-based authentication using the current user ID from the request context.

Update controllers to use:
```typescript
@CurrentUser() userId: string
```

### Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK` - Successful operation
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Rate Limiting

Recommended: Implement rate limiting per user/IP in production using NestJS Throttler.

## Performance Considerations

1. **Indexing**: All frequently queried fields are indexed
2. **Pagination**: Leaderboard and room listings use pagination
3. **Caching**: Implement Redis caching for:
   - Leaderboard rankings
   - User friend lists
   - Active rooms list
4. **Database Optimization**:
   - Connection pooling
   - Query optimization
   - Batch operations for bulk updates

## Security

1. **Input Validation**: All DTOs use class-validator
2. **CORS**: Configured for WebSocket connections
3. **Database**: Prepared statements (TypeORM)
4. **Password Storage**: Hash room passwords in production
5. **Authentication**: Implement JWT token validation

## Contributing

Follow these guidelines:
1. Use TypeScript strict mode
2. Add unit tests for new features
3. Follow NestJS best practices
4. Document API endpoints
5. Update migrations for schema changes

## License

UNLICENSED

## Support

For issues or questions about the Social Service, please refer to the main quest-service documentation.
