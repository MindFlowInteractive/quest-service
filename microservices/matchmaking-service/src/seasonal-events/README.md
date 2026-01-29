# Seasonal Events and Limited-Time Puzzles System

A comprehensive NestJS module for managing seasonal events with time-limited puzzles, player progress tracking, rewards distribution, and leaderboards.

## Features

✅ **Event Scheduling System**: Events automatically start and end based on `startDate` and `endDate` using cron jobs  
✅ **Event-Specific Puzzle Categories**: Each event has puzzles organized by categories  
✅ **Time-Limited Puzzle Availability**: Puzzles are only accessible during their event's active period  
✅ **Seasonal Reward Distribution**: Automatic reward distribution based on score and puzzle completion  
✅ **Event Leaderboards**: Multiple leaderboard types (overall, category, streak, speed, global)  
✅ **Event Announcement System**: REST endpoint for event announcements (ready for WebSocket integration)  
✅ **Player Progress Tracking**: Comprehensive statistics and history per player per event  

## Architecture

### Entities

#### 1. **SeasonalEvent** ([`seasonal-event.entity.ts`](./entities/seasonal-event.entity.ts))
Main event entity with automatic activation/deactivation.

**Key Fields:**
- `name`, `description`, `theme`
- `startDate`, `endDate`, `isActive`
- `participantCount`, `totalPuzzlesCompleted`
- Relationships: `puzzles`, `playerEvents`, `rewards`

#### 2. **EventPuzzle** ([`event-puzzle.entity.ts`](./entities/event-puzzle.entity.ts))
Puzzles specific to an event with various types and difficulties.

**Key Fields:**
- `question`, `category`, `difficulty`
- `content` (JSONB): question type, options, correct answer, explanation
- `rewardPoints`, `timeLimit`, `maxAttempts`
- `completionCount`, `attemptCount`

#### 3. **PlayerEvent** ([`player-event.entity.ts`](./entities/player-event.entity.ts))
Tracks individual player progress in an event.

**Key Fields:**
- `playerId`, `eventId`, `score`
- `completedPuzzles`, `rewards`
- `currentStreak`, `bestStreak`
- `statistics` (JSONB): category breakdown, difficulty breakdown, daily progress

#### 4. **EventReward** ([`event-reward.entity.ts`](./entities/event-reward.entity.ts))
Rewards that can be earned during events.

**Key Fields:**
- `name`, `type` (points, badge, item, currency, title, avatar, nft)
- `requiredScore`, `requiredPuzzles`
- `rewardData` (JSONB): value, imageUrl, rarity, metadata
- `claimedCount`, `maxClaims`

### Services

#### 1. **SeasonalEventService** ([`seasonal-event.service.ts`](./services/seasonal-event.service.ts))
Manages event lifecycle with automatic activation/deactivation.

**Key Methods:**
- `handleEventActivation()` - Cron job (every 5 minutes) to activate/deactivate events
- `createEvent()` - Create new event
- `findActiveEvents()` - Get all currently active events
- `getEventStatistics()` - Get event stats (participants, completion rate, etc.)

#### 2. **EventPuzzleService** ([`event-puzzle.service.ts`](./services/event-puzzle.service.ts))
Manages event-specific puzzles with time-based access control.

**Key Methods:**
- `createPuzzle()` - Add puzzle to event
- `findPuzzlesByEvent()` - Get puzzles (only if event is active)
- `findPuzzlesByCategory()` - Filter by category
- `verifyAnswer()` - Check answer correctness

#### 3. **PlayerEventService** ([`player-event.service.ts`](./services/player-event.service.ts))
Handles player progress, answer submission, and reward distribution.

**Key Methods:**
- `submitAnswer()` - Submit puzzle answer, update score, check rewards
- `getPlayerProgress()` - Get player's event progress
- `getPlayerRank()` - Get player's rank and percentile
- `checkAndAwardRewards()` - Automatic reward distribution

#### 4. **LeaderboardService** ([`leaderboard.service.ts`](./services/leaderboard.service.ts))
Provides various leaderboard views.

**Key Methods:**
- `getEventLeaderboard()` - Top players by score
- `getCategoryLeaderboard()` - Top players per category
- `getStreakLeaderboard()` - Best streaks
- `getSpeedLeaderboard()` - Fastest completion times
- `getGlobalLeaderboard()` - Cross-event rankings

#### 5. **EventRewardService** ([`event-reward.service.ts`](./services/event-reward.service.ts))
Manages event rewards.

**Key Methods:**
- `createReward()` - Add reward to event
- `findActiveRewardsByEvent()` - Get available rewards
- `getAvailableRewards()` - Get rewards player can claim

## API Endpoints

### Event Management

```
GET    /seasonal-events/active              - Get all active events
GET    /seasonal-events/upcoming            - Get upcoming events
GET    /seasonal-events/past                - Get past events
GET    /seasonal-events/:eventId            - Get specific event
GET    /seasonal-events/:eventId/statistics - Get event statistics
POST   /seasonal-events                     - Create event (Admin)
PUT    /seasonal-events/:eventId            - Update event (Admin)
DELETE /seasonal-events/:eventId            - Delete event (Admin)
```

### Puzzle Management

```
GET    /seasonal-events/:eventId/puzzles                    - Get all event puzzles
GET    /seasonal-events/:eventId/puzzles/category/:category - Get puzzles by category
GET    /seasonal-events/:eventId/categories                 - Get event categories
GET    /seasonal-events/:eventId/puzzles/:puzzleId          - Get specific puzzle
POST   /seasonal-events/:eventId/puzzles                    - Create puzzle (Admin)
PUT    /seasonal-events/:eventId/puzzles/:puzzleId          - Update puzzle (Admin)
DELETE /seasonal-events/:eventId/puzzles/:puzzleId          - Delete puzzle (Admin)
```

### Player Progress

```
POST   /seasonal-events/:eventId/submit                     - Submit puzzle answer
GET    /seasonal-events/:eventId/progress/:playerId         - Get player progress
GET    /seasonal-events/:eventId/rank/:playerId             - Get player rank
GET    /seasonal-events/player/:playerId/events             - Get player's events
```

### Leaderboards

```
GET    /seasonal-events/:eventId/leaderboard                      - Event leaderboard
GET    /seasonal-events/:eventId/leaderboard/player/:playerId     - Leaderboard with player
GET    /seasonal-events/:eventId/leaderboard/category/:category   - Category leaderboard
GET    /seasonal-events/:eventId/leaderboard/streak               - Streak leaderboard
GET    /seasonal-events/:eventId/leaderboard/speed                - Speed leaderboard
GET    /seasonal-events/leaderboard/global                        - Global leaderboard
```

### Rewards

```
GET    /seasonal-events/:eventId/rewards                    - Get event rewards
GET    /seasonal-events/:eventId/rewards/type/:type         - Get rewards by type
GET    /seasonal-events/:eventId/rewards/available/:playerId - Get available rewards
POST   /seasonal-events/:eventId/rewards                    - Create reward (Admin)
PUT    /seasonal-events/:eventId/rewards/:rewardId          - Update reward (Admin)
DELETE /seasonal-events/:eventId/rewards/:rewardId          - Delete reward (Admin)
```

### Announcements

```
POST   /seasonal-events/:eventId/announce                   - Announce event
```

## Usage Examples

### 1. Create a Seasonal Event

```typescript
POST /seasonal-events
{
  "name": "Halloween Puzzle Challenge 2024",
  "description": "Spooky puzzles for the Halloween season!",
  "theme": "halloween",
  "startDate": "2024-10-25T00:00:00Z",
  "endDate": "2024-11-01T23:59:59Z",
  "isPublished": true,
  "bannerImage": {
    "url": "https://example.com/halloween-banner.jpg",
    "alt": "Halloween Event Banner"
  },
  "metadata": {
    "eventType": "competitive",
    "minLevel": 1,
    "rules": ["Complete puzzles to earn points", "Top 10 players win special badges"]
  }
}
```

### 2. Add Puzzles to Event

```typescript
POST /seasonal-events/:eventId/puzzles
{
  "eventId": "event-uuid",
  "question": "What has a head, a tail, but no body?",
  "category": "riddle",
  "difficulty": "easy",
  "content": {
    "type": "multiple-choice",
    "options": ["A snake", "A coin", "A river", "A ghost"],
    "correctAnswer": "A coin",
    "explanation": "A coin has a head (front) and tail (back) but no body!"
  },
  "rewardPoints": 100,
  "timeLimit": 60,
  "tags": ["halloween", "riddle", "easy"]
}
```

### 3. Submit Puzzle Answer

```typescript
POST /seasonal-events/:eventId/submit?playerId=player-uuid
{
  "puzzleId": "puzzle-uuid",
  "answer": "A coin",
  "timeTaken": 45,
  "hintsUsed": 0
}

// Response:
{
  "isCorrect": true,
  "pointsEarned": 120,  // Base 100 + 20 time bonus
  "newScore": 320,
  "rewardsEarned": [
    {
      "rewardId": "reward-uuid",
      "rewardName": "Puzzle Master Badge",
      "rewardType": "badge",
      "earnedAt": "2024-10-26T10:30:00Z"
    }
  ],
  "explanation": "A coin has a head (front) and tail (back) but no body!"
}
```

### 4. Create Rewards

```typescript
POST /seasonal-events/:eventId/rewards
{
  "eventId": "event-uuid",
  "name": "Halloween Champion Badge",
  "description": "Awarded to top performers in the Halloween event",
  "type": "badge",
  "requiredScore": 1000,
  "requiredPuzzles": 10,
  "rewardData": {
    "imageUrl": "https://example.com/champion-badge.png",
    "rarity": "legendary"
  },
  "maxClaims": 10,
  "displayOrder": 1
}
```

### 5. Get Leaderboard

```typescript
GET /seasonal-events/:eventId/leaderboard?limit=10

// Response:
[
  {
    "rank": 1,
    "playerId": "player-1",
    "score": 2500,
    "puzzlesCompleted": 25,
    "currentStreak": 10,
    "bestStreak": 15,
    "lastActivityAt": "2024-10-26T15:30:00Z"
  },
  // ... more entries
]
```

## Automatic Event Activation

The system uses a cron job that runs **every 5 minutes** to automatically:

1. **Activate events** when `startDate` is reached and `endDate` hasn't passed
2. **Deactivate events** when `endDate` is reached

```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async handleEventActivation() {
  // Automatically activates/deactivates events
}
```

## Reward Distribution Logic

Rewards are automatically checked and distributed when:
- A player completes a puzzle correctly
- Player's score reaches the `requiredScore` threshold
- Player completes the `requiredPuzzles` count (if specified)
- Reward hasn't reached `maxClaims` limit

## Scoring System

### Base Points
- Each puzzle has a `rewardPoints` value

### Bonuses
- **Time Bonus**: +20% if completed in less than 50% of time limit
- **Streak Bonus**: Maintained through consecutive correct answers

### Penalties
- **Hint Penalty**: -10% per hint used

## Database Schema

All entities use TypeORM with proper relationships:

- **OneToMany**: Event → Puzzles, Event → PlayerEvents, Event → Rewards
- **ManyToOne**: Puzzle → Event, PlayerEvent → Event, Reward → Event
- **Cascade**: Deleting an event cascades to all related entities
- **Indexes**: Optimized queries on frequently accessed fields

## Integration with Notification Service

The announcement endpoint is ready for integration:

```typescript
POST /seasonal-events/:eventId/announce

// TODO: Integrate with your notification service
// await this.notificationService.broadcastEventAnnouncement(event);
```

## Security Considerations

⚠️ **Important**: In production, implement:

1. **Authentication Guards**: Protect endpoints with JWT/session auth
2. **Authorization**: Restrict admin endpoints (create, update, delete)
3. **Rate Limiting**: Already configured via ThrottlerGuard
4. **Input Validation**: All DTOs use class-validator
5. **Player ID from Token**: Extract `playerId` from authenticated user, not query params

## Testing

Run the application and test endpoints:

```bash
# Start the application
npm run start:dev

# Test creating an event
curl -X POST http://localhost:3000/seasonal-events \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","description":"Test","startDate":"2024-01-01","endDate":"2024-12-31"}'

# Get active events
curl http://localhost:3000/seasonal-events/active
```

## Migration

To create database tables, run:

```bash
npm run typeorm:migration:generate -- src/migrations/CreateSeasonalEvents
npm run typeorm:migration:run
```

## Module Structure

```
src/seasonal-events/
├── entities/
│   ├── seasonal-event.entity.ts
│   ├── event-puzzle.entity.ts
│   ├── player-event.entity.ts
│   ├── event-reward.entity.ts
│   └── index.ts
├── services/
│   ├── seasonal-event.service.ts
│   ├── event-puzzle.service.ts
│   ├── player-event.service.ts
│   ├── leaderboard.service.ts
│   ├── event-reward.service.ts
│   └── index.ts
├── dto/
│   ├── create-event.dto.ts
│   ├── create-puzzle.dto.ts
│   ├── create-reward.dto.ts
│   ├── submit-answer.dto.ts
│   └── index.ts
├── seasonal-events.controller.ts
├── seasonal-events.module.ts
└── README.md
```

## Dependencies

All required dependencies are already in your `package.json`:
- `@nestjs/typeorm` - Database ORM
- `@nestjs/schedule` - Cron jobs
- `typeorm` - Database operations
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

## Next Steps

1. ✅ Module is ready to use - already imported in `app.module.ts`
2. 🔧 Run migrations to create database tables
3. 🔐 Add authentication guards to protect endpoints
4. 🔔 Integrate with notification service for event announcements
5. 🎨 Add WebSocket support for real-time leaderboard updates
6. 📊 Add analytics tracking for event performance

## Support

For questions or issues, refer to the inline documentation in each service file.
