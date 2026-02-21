# Player Skill Rating and ELO System

## Overview

This module implements a comprehensive ELO-based skill rating system for tracking player performance and skill levels in puzzle solving. The system includes:

- ELO rating calculations with performance-based adjustments
- Skill tier system (Bronze to Grandmaster)
- Seasonal rating periods with optional resets
- Inactivity decay mechanism
- Detailed rating history tracking
- Leaderboard functionality
- Matchmaking support

## Features

### 1. ELO Rating System
- **Base ELO Formula**: Standard ELO rating calculation
- **Performance Multipliers**: 
  - Time-based bonuses/penalties
  - Hint usage penalties
  - Attempt count penalties
  - Difficulty weighting
- **K-Factor Scaling**: Adaptive K-factor based on player experience
- **Rating Bounds**: Minimum rating of 100 to prevent negative ratings

### 2. Skill Tiers
Players are categorized into skill tiers based on their ELO rating:

| Tier | Rating Range | Description |
|------|-------------|-------------|
| Bronze | < 1200 | New players learning the basics |
| Silver | 1200-1399 | Developing problem-solving skills |
| Gold | 1400-1599 | Solid intermediate players |
| Platinum | 1600-1799 | Advanced players |
| Diamond | 1800-1999 | Expert level players |
| Master | 2000-2399 | Elite players |
| Grandmaster | ≥ 2400 | Top-tier players |

### 3. Season System
- **Seasonal Periods**: Time-based rating periods (default: 3 months)
- **Optional Resets**: Configurable seasonal rating resets
- **Season History**: Track performance across multiple seasons
- **Status Tracking**: Active, Ended, Reset status for each season

### 4. Inactivity Decay
- **Decay Trigger**: After 30 days of inactivity
- **Decay Rate**: 2 rating points per week of inactivity
- **Minimum Protection**: Rating cannot decay below 100
- **Automatic Application**: Runs daily via cron job

### 5. Rating History
- **Detailed Tracking**: Complete history of rating changes
- **Performance Metrics**: Time taken, hints used, attempts
- **Change Reasons**: Completion, failure, decay, seasonal reset
- **Metadata Storage**: Expected win probability, K-factor, bonuses

## Database Schema

### Player Ratings Table
```sql
player_ratings {
  id: uuid (PK)
  userId: uuid (FK to users)
  rating: int (default: 1200)
  ratingDeviation: int
  tier: varchar (bronze/silver/gold/platinum/diamond/master/grandmaster)
  seasonId: varchar
  seasonStatus: varchar (active/ended/reset)
  gamesPlayed: int
  wins: int
  losses: int
  draws: int
  streak: int
  bestStreak: int
  lastPlayedAt: timestamp
  lastRatingUpdate: timestamp
  winRate: decimal
  statistics: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Rating History Table
```sql
rating_history {
  id: uuid (PK)
  playerRatingId: uuid (FK to player_ratings)
  oldRating: int
  newRating: int
  ratingChange: int
  reason: varchar (puzzle_completed/puzzle_failed/inactivity_decay/seasonal_reset/admin_adjustment)
  puzzleId: uuid (FK to puzzles, nullable)
  puzzleDifficulty: varchar
  timeTaken: int
  hintsUsed: int
  attempts: int
  wasCompleted: boolean
  metadata: jsonb
  createdAt: timestamp
}
```

### Seasons Table
```sql
seasons {
  id: uuid (PK)
  name: varchar
  seasonId: varchar (unique)
  status: varchar (upcoming/active/ended)
  startDate: timestamp
  endDate: timestamp
  requiresReset: boolean
  defaultRating: int
  config: jsonb
  metadata: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

## API Endpoints

### Get Player Rating
```
GET /skill-rating/player/:userId
```
Returns the current rating information for a player.

### Update Rating on Puzzle Completion
```
POST /skill-rating/puzzle-completion
```
Body:
```json
{
  "userId": "uuid",
  "puzzleId": "uuid",
  "puzzleDifficulty": "easy|medium|hard|expert",
  "difficultyRating": 5,
  "wasCompleted": true,
  "timeTaken": 120,
  "hintsUsed": 0,
  "attempts": 1,
  "basePoints": 100
}
```

### Get Rating History
```
GET /skill-rating/history/:userId?limit=50
```

### Get Leaderboard
```
GET /skill-rating/leaderboard?limit=100&offset=0
```

### Get Player Rank
```
GET /skill-rating/rank/:userId
```

### Get Current Season
```
GET /skill-rating/season/current
```

### Get All Seasons
```
GET /skill-rating/seasons
```

### End Season (Admin)
```
POST /skill-rating/season/:seasonId/end
```

## ELO Calculation Details

### Expected Win Probability
```javascript
// Convert puzzle difficulty (1-10) to ELO rating
const puzzleEloRating = 800 + (difficulty - 1) * 133.33;

// Standard ELO formula
const expectedWinProbability = 1 / (1 + Math.pow(10, (puzzleEloRating - playerRating) / 400));
```

### K-Factor Determination
- **New Players** (< 30 games): K = 40
- **Established Players** (< 2000 rating): K = 20
- **High-Rated Players** (< 2400 rating): K = 15
- **Masters** (≥ 2400 rating): K = 10

### Performance Bonuses/Penalties
- **Time Bonus**: 
  - ≤ 30% time limit: +15 points
  - ≤ 60% time limit: +10 points
  - ≤ 100% time limit: +5 points
  - > 150% time limit: -5 points
  - > 200% time limit: -10 points

- **Hint Penalty**: -5 points per hint used
- **Attempt Penalty**: -3 points per additional attempt
- **Difficulty Multiplier**: 
  - Easy (1-3): 1.0x
  - Medium (4-5): 1.1x
  - Hard (6-7): 1.3x
  - Expert (8-10): 1.5x

## Integration with Puzzle System

The system integrates with the existing puzzle completion flow:

1. When a puzzle is completed, call the `updateRatingOnPuzzleCompletion` endpoint
2. The system automatically:
   - Calculates the appropriate rating change
   - Updates the player's tier
   - Records the change in history
   - Updates statistics

Example integration in puzzle completion handler:
```typescript
// In your puzzle completion service
async handlePuzzleCompletion(userId: string, puzzleId: string, result: PuzzleResult) {
  const puzzle = await this.puzzleRepository.findOne({ where: { id: puzzleId } });
  
  const completionData = {
    userId,
    puzzleId,
    puzzleDifficulty: puzzle.difficulty,
    difficultyRating: puzzle.difficultyRating,
    wasCompleted: result.completed,
    timeTaken: result.timeTaken,
    hintsUsed: result.hintsUsed,
    attempts: result.attempts,
    basePoints: puzzle.basePoints,
  };
  
  await this.skillRatingService.updateRatingOnPuzzleCompletion(completionData);
  
  // Continue with other completion logic...
}
```

## Configuration

### Season Configuration
```json
{
  "decayEnabled": true,
  "decayPeriodDays": 30,
  "decayAmount": 2,
  "minRating": 100,
  "kFactor": 32,
  "tierThresholds": {
    "bronze": 1200,
    "silver": 1400,
    "gold": 1600,
    "platinum": 1800,
    "diamond": 2000,
    "master": 2400
  }
}
```

## Testing

Run the ELO service tests:
```bash
npm run test src/skill-rating/elo.service.spec.ts
```

## Future Enhancements

- [ ] Glicko-2 rating system implementation
- [ ] Matchmaking integration
- [ ] Achievement system based on rating milestones
- [ ] Rating prediction and analytics
- [ ] Peer comparison features
- [ ] Rating volatility tracking

## Troubleshooting

### Common Issues

1. **Rating not updating**: Ensure the puzzle completion data includes all required fields
2. **Incorrect tier assignment**: Check the tier threshold configuration in the season
3. **Decay not applying**: Verify the cron job is running and the player is actually inactive
4. **History not recording**: Check database constraints and foreign key relationships

### Debugging

Enable debug logging:
```bash
LOG_LEVEL=debug npm run start
```

Check the service logs for rating calculation details and any errors.
