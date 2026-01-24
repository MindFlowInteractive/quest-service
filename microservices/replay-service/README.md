# Replay Service

A comprehensive microservice for recording, storing, and replaying puzzle-solving sessions with advanced analytics and sharing capabilities.

## Features

### 🎬 Action Recording
- Record player actions during gameplay with precise timestamps
- Support for various action types (move, place piece, rotate, flip, hint used, undo, redo, etc.)
- Batch action recording for improved performance
- Action sequencing and relative timing tracking

### 💾 Replay Storage & Retrieval
- Efficient storage of complete replay sessions
- Multiple compression options (GZIP, Brotli) for storage optimization
- Support for multiple storage backends (Local, S3, Azure)
- Automatic compression type selection based on data size
- Detailed storage metrics and compression ratios

### ▶️ Playback Controls
- Smooth playback generation with adjustable speed controls
- Position-based playback (start/end position selection)
- Frame rate configuration (default 30 FPS)
- Adjusted timing calculations for speed variations

### 🔒 Privacy & Sharing
- Granular privacy levels: Private, Shared, Public, Unlisted
- User-based access control
- Dynamic share token generation
- Access revocation capabilities

### 📊 Advanced Analytics
- Comprehensive replay analysis with skill level assessment
- Action breakdown and efficiency scoring
- Consistency metrics and peak activity detection
- Hint usage and undo/redo ratio tracking
- Multi-replay comparison capabilities

### 🗂️ Recording Management
- Recording status tracking and metadata storage
- Automatic cleanup and deletion
- Recording statistics and monitoring

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
# Watch mode
npm run start:dev

# Debug mode
npm run start:debug
```

### Production

```bash
npm run build
npm run start:prod
```

### Docker

```bash
docker-compose up -d
```

## Environment Configuration

```dotenv
NODE_ENV=development
PORT=3007
DB_HOST=localhost
DB_PORT=5433
DB_USER=replay_user
DB_PASSWORD=replay_password
DB_NAME=replay_db
STORAGE_TYPE=local
STORAGE_PATH=./storage/replays
```

## API Documentation

### Replay Endpoints
- `POST /replay/create` - Create replay
- `GET /replay/:replayId` - Get replay
- `DELETE /replay/:replayId` - Delete replay

### Action Recording
- `POST /replay/:replayId/action` - Record action
- `POST /replay/:replayId/actions` - Batch record
- `GET /replay/:replayId/actions` - Get actions

### Playback
- `POST /replay/:replayId/playback` - Generate playback

### Storage
- `POST /replay/:replayId/save` - Save recording
- `GET /replay/recording/:recordingId/retrieve` - Retrieve recording

### Sharing
- `PUT /replay/:replayId/privacy` - Update privacy
- `POST /replay/:replayId/share` - Share replay

### Analytics
- `GET /replay/:replayId/analytics` - Get analytics
- `POST /replay/analytics/compare` - Compare replays

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## License

UNLICENSED
