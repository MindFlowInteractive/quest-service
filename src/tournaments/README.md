# Tournament System Documentation

## Overview

The Tournament System allows players to compete in bracket-style puzzle competitions with prizes. It supports multiple tournament formats, automatic bracket generation, match scheduling, real-time progression, and spectator mode.

## Features

### ✅ Implemented Features

1. **Tournament Bracket Structure**
   - Single-elimination brackets
   - Double-elimination brackets
   - Round-robin tournaments
   - Swiss system tournaments

2. **Tournament Registration System**
   - User registration with entry requirements
   - Entry fee support (points/coins/tokens)
   - Registration time windows
   - Participant withdrawal
   - Maximum participant limits

3. **Match Scheduling and Pairing**
   - Automatic bracket generation
   - Seeding methods (random, ranked, seeded)
   - Match progression and advancement
   - Bye handling for odd participant counts

4. **Real-time Tournament Progression**
   - Match result submission
   - Automatic winner advancement
   - Participant statistics tracking
   - Tournament completion detection

5. **Prize Pool Distribution**
   - Configurable prize distribution
   - Multiple prize positions (1st, 2nd, 3rd, etc.)
   - Prize currencies (points, coins, tokens)
   - Badge and achievement rewards

6. **Tournament History and Archives**
   - Completed tournament tracking
   - Tournament history retrieval
   - Match history
   - Participant performance records

7. **Spectator Mode**
   - Join tournaments as spectator
   - Watch specific matches
   - Track watch time
   - Spectator statistics

## Database Schema

### Tournaments Table
- Tournament metadata and configuration
- Bracket structure
- Prize pool information
- Entry requirements
- Tournament rules

### Tournament Participants Table
- Participant registration
- Performance statistics
- Prize awards
- Seeding information

### Tournament Matches Table
- Match scheduling
- Player pairings
- Match results
- Puzzle assignments

### Tournament Spectators Table
- Spectator tracking
- Engagement metrics
- Watch time statistics

## API Endpoints

### Tournament Management

#### Create Tournament
```
POST /tournaments
```
Creates a new tournament with specified configuration.

**Request Body:**
```json
{
  "name": "Summer Championship 2026",
  "description": "Annual summer puzzle championship",
  "bracketType": "single-elimination",
  "maxParticipants": 16,
  "registrationStartTime": "2026-01-25T00:00:00Z",
  "registrationEndTime": "2026-01-30T00:00:00Z",
  "startTime": "2026-02-01T00:00:00Z",
  "entryRequirements": {
    "minLevel": 5,
    "minScore": 1000,
    "entryFee": 100
  },
  "prizePool": {
    "totalPrize": 10000,
    "currency": "points",
    "distribution": [
      {
        "position": 1,
        "amount": 5000,
        "percentage": 50,
        "badges": ["champion"],
        "achievements": ["tournament-winner"]
      },
      {
        "position": 2,
        "amount": 3000,
        "percentage": 30
      },
      {
        "position": 3,
        "amount": 2000,
        "percentage": 20
      }
    ]
  },
  "config": {
    "puzzleCategories": ["logic", "math"],
    "difficultyRange": {
      "min": "medium",
      "max": "expert"
    },
    "matchDuration": 600,
    "bestOf": 3,
    "spectatorEnabled": true,
    "liveScoring": true
  }
}
```

#### Get All Tournaments
```
GET /tournaments?status=in-progress&page=1&limit=10
```

**Query Parameters:**
- `status`: Filter by status (scheduled, registration, in-progress, completed, cancelled)
- `bracketType`: Filter by bracket type
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Sort field (startTime, createdAt, prizePool, participants)
- `sortOrder`: Sort order (ASC, DESC)

#### Get Tournament Details
```
GET /tournaments/:id
```

#### Update Tournament
```
PATCH /tournaments/:id
```

#### Delete Tournament
```
DELETE /tournaments/:id
```

### Tournament Participation

#### Register for Tournament
```
POST /tournaments/:id/register
```

Registers the current user for the tournament.

#### Withdraw from Tournament
```
POST /tournaments/:id/withdraw
```

#### Generate Bracket
```
POST /tournaments/:id/generate-bracket
```

Generates the tournament bracket based on registered participants.

#### Get Tournament Bracket
```
GET /tournaments/:id/bracket
```

Returns the full tournament bracket structure.

**Response:**
```json
{
  "success": true,
  "data": {
    "tournamentId": "uuid",
    "bracketType": "single-elimination",
    "rounds": [
      {
        "roundNumber": 1,
        "roundName": "Quarter-Finals",
        "matches": [
          {
            "matchId": "uuid",
            "roundNumber": 1,
            "matchNumber": 1,
            "player1": {
              "id": "p1-uuid",
              "name": "Player1",
              "seed": 1
            },
            "player2": {
              "id": "p2-uuid",
              "name": "Player2",
              "seed": 8
            },
            "status": "completed",
            "winner": {
              "id": "p1-uuid",
              "name": "Player1"
            }
          }
        ],
        "isComplete": true
      }
    ],
    "totalRounds": 3,
    "currentRound": 2
  }
}
```

### Match Management

#### Submit Match Result
```
POST /tournaments/matches/:matchId/result
```

**Request Body:**
```json
{
  "matchId": "uuid",
  "winnerId": "participant-uuid",
  "player1Score": 3,
  "player2Score": 1,
  "puzzleIds": ["puzzle1", "puzzle2", "puzzle3"],
  "puzzleResults": [
    {
      "puzzleId": "puzzle1",
      "player1Time": 45,
      "player1Score": 100,
      "player1Correct": true,
      "player2Time": 60,
      "player2Score": 80,
      "player2Correct": true,
      "winner": "participant-uuid"
    }
  ]
}
```

### Tournament Information

#### Get Tournament Standings
```
GET /tournaments/:id/standings
```

Returns current tournament standings.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "position": 1,
      "participantId": "uuid",
      "userId": "uuid",
      "username": "Champion",
      "wins": 3,
      "losses": 0,
      "draws": 0,
      "totalScore": 450,
      "averageAccuracy": 95.5,
      "status": "active"
    }
  ]
}
```

#### Get Tournament History
```
GET /tournaments/:id/history
```

Returns complete tournament history including all matches and results.

#### Get Completed Tournaments
```
GET /tournaments/completed?limit=10
```

### Spectator Mode

#### Join as Spectator
```
POST /tournaments/:id/spectate?matchId=optional-match-id
```

Join a tournament as a spectator.

#### Leave Spectator Mode
```
POST /tournaments/spectators/:spectatorId/leave
```

#### Get Active Spectators
```
GET /tournaments/:id/spectators
```

Returns list of active spectators for the tournament.

## Tournament Workflow

### 1. Tournament Creation
1. Admin creates tournament with configuration
2. Set registration window and start time
3. Configure prize pool and entry requirements
4. Publish tournament

### 2. Registration Phase
1. Users register during registration window
2. Entry requirements checked
3. Entry fee collected (if applicable)
4. Registration closes at deadline

### 3. Bracket Generation
1. Admin triggers bracket generation
2. Participants seeded based on configuration
3. Matches created for first round
4. Tournament status changes to "in-progress"

### 4. Tournament Execution
1. Matches played according to schedule
2. Results submitted after each match
3. Winners advance automatically
4. Statistics tracked in real-time

### 5. Tournament Completion
1. Final match determines winner
2. Tournament marked as completed
3. Prizes distributed automatically
4. Tournament archived

## Bracket Types

### Single Elimination
- Players eliminated after one loss
- Fastest tournament format
- Winner determined in log2(n) rounds
- Bye handling for non-power-of-2 participants

### Double Elimination
- Players get second chance in loser's bracket
- More competitive and fair
- Requires more matches
- Grand finals may require bracket reset

### Round Robin
- Every player plays every other player
- Most fair format
- Time-consuming for large tournaments
- Standings based on overall record

### Swiss System
- Pair players with similar records
- Fixed number of rounds
- Good for large tournaments
- Balanced between fairness and efficiency

## Configuration Options

### Entry Requirements
```typescript
{
  minLevel?: number;          // Minimum player level
  minScore?: number;          // Minimum total score
  minPuzzlesSolved?: number;  // Minimum puzzles completed
  requiredAchievements?: string[];  // Required achievement IDs
  entryFee?: number;          // Entry fee in points/coins
}
```

### Match Configuration
```typescript
{
  puzzleCategories?: string[];  // Categories of puzzles
  difficultyRange?: {
    min: 'easy' | 'medium' | 'hard' | 'expert';
    max: 'easy' | 'medium' | 'hard' | 'expert';
  };
  matchDuration?: number;       // Seconds per match
  bestOf?: number;              // Best of N puzzles
  autoAdvance?: boolean;        // Auto advance winners
  spectatorEnabled?: boolean;   // Allow spectators
  liveScoring?: boolean;        // Real-time score updates
  tiebreaker?: 'time' | 'accuracy' | 'sudden-death';
}
```

## Statistics Tracked

### Tournament Statistics
- Total matches
- Completion rate
- Average match duration
- Total puzzles solved
- Viewer statistics

### Participant Statistics
- Wins/losses/draws
- Total score
- Average accuracy
- Average completion time
- Longest win streak
- Best/worst rounds

### Match Statistics
- Player accuracy
- Average time per puzzle
- Spectator count
- Performance metrics

## Testing

Run tournament system tests:

```bash
# Unit tests
npm run test -- tournaments

# Integration tests
npm run test:integration -- tournaments

# E2E tests
npm run test:e2e -- tournaments
```

## Future Enhancements

- [ ] Team tournaments
- [ ] Tournament chat and messaging
- [ ] Live streaming integration
- [ ] Tournament templates
- [ ] Automated scheduling
- [ ] ELO rating system
- [ ] Tournament replays
- [ ] Advanced analytics dashboard
- [ ] Mobile app integration
- [ ] Tournament sponsorships

## Example Usage

### Create a Simple Tournament

```typescript
const tournament = await tournamentsService.create({
  name: "Weekly Championship",
  description: "Weekly puzzle competition",
  bracketType: "single-elimination",
  maxParticipants: 8,
  registrationStartTime: new Date(),
  registrationEndTime: new Date(Date.now() + 86400000),
  startTime: new Date(Date.now() + 172800000),
  prizePool: {
    totalPrize: 1000,
    currency: "points",
    distribution: [
      { position: 1, amount: 500, percentage: 50 },
      { position: 2, amount: 300, percentage: 30 },
      { position: 3, amount: 200, percentage: 20 }
    ]
  }
});
```

### Register for Tournament

```typescript
const participant = await tournamentsService.registerParticipant(
  tournamentId,
  userId,
  username
);
```

### Generate and Start Tournament

```typescript
const bracket = await tournamentsService.generateBracket(tournamentId);
```

### Submit Match Result

```typescript
await tournamentsService.submitMatchResult(
  matchId,
  winnerId,
  player1Score,
  player2Score,
  puzzleResults
);
```

## Troubleshooting

### Common Issues

1. **Tournament is full**
   - Increase maxParticipants
   - Create new tournament

2. **Registration closed**
   - Check registration time window
   - Extend registration deadline

3. **Bracket generation fails**
   - Ensure minimum 2 participants
   - Check all participants have valid status

4. **Match result submission fails**
   - Verify match exists and is in-progress
   - Ensure winner is valid participant
   - Check score values are valid

## Performance Considerations

- Index on tournament status and startTime for queries
- Index on participant tournamentId and userId for lookups
- Use pagination for large tournament lists
- Cache bracket structure for active tournaments
- Optimize spectator queries with active status index

## Security Considerations

- Validate user authorization for tournament actions
- Verify entry requirements before registration
- Rate limit tournament creation
- Validate match results before submission
- Protect admin-only operations

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
