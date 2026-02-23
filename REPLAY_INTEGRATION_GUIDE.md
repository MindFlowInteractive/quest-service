# Puzzle Replay Feature - Integration Guide

## Quick Start

### 1. Import ReplayModule

Add ReplayModule to your application module:

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReplayModule } from './replay/replay.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // ... your database config
    }),
    ReplayModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 2. Update GameSessionService Integration

Modify your game session controller to create and manage replays:

```typescript
import { ReplayService } from '../replay/services/replay.service';

@Controller('game-sessions')
export class GameSessionController {
  constructor(
    private gameSessionService: GameSessionService,
    private replayService: ReplayService,
  ) {}

  @Post()
  async startGameSession(@Body() dto: CreateSessionDto, @Req() req: Request) {
    const userId = req.user.id;
    
    // Create game session
    const session = await this.gameSessionService.create(userId);

    // Create replay for the session
    const replay = await this.replayService.createReplay(userId, {
      puzzleId: dto.puzzleId,
      puzzleTitle: dto.puzzleTitle,
      puzzleCategory: dto.puzzleCategory,
      puzzleDifficulty: dto.puzzleDifficulty,
      gameSessionId: session.id,
      initialState: dto.initialGameState,
      userMetadata: {
        playerLevel: req.user.level,
        completedPuzzlesCount: req.user.completedPuzzles,
      },
      sessionMetadata: {
        platform: req.headers['user-agent'],
        device: req.headers['x-device-type'],
      },
    });

    return {
      sessionId: session.id,
      replayId: replay.id,
    };
  }

  @Post(':sessionId/action')
  async recordGameAction(
    @Param('sessionId') sessionId: string,
    @Body() actionDto: RecordActionDto,
    @Req() req: Request,
  ) {
    // Get the replay associated with this session
    const session = await this.gameSessionService.getSession(sessionId);
    const userId = req.user.id;

    // Record action in replay
    const recordedAction = await this.replayService.recordAction(
      session.replayId,
      {
        actionType: actionDto.actionType,
        timestamp: actionDto.timestamp,
        actionData: actionDto.actionData,
        stateBefore: actionDto.stateBefore,
        stateAfter: actionDto.stateAfter,
        metadata: {
          duration: actionDto.duration,
          confidence: actionDto.confidence,
        },
      },
    );

    // Also update game session state
    await this.gameSessionService.updateState(sessionId, actionDto.stateAfter);

    return recordedAction;
  }

  @Post(':sessionId/complete')
  async completeGameSession(
    @Param('sessionId') sessionId: string,
    @Body() completeDto: CompleteSessionDto,
    @Req() req: Request,
  ) {
    const session = await this.gameSessionService.getSession(sessionId);
    const userId = req.user.id;

    // Complete game session
    const completedSession = await this.gameSessionService.end(sessionId, 'COMPLETED');

    // Complete replay
    const replay = await this.replayService.completeReplay(session.replayId, {
      isSolved: completeDto.isSolved,
      totalDuration: completeDto.totalDuration,
      activeTime: completeDto.activeTime,
      scoreEarned: completeDto.scoreEarned,
      maxScorePossible: completeDto.maxScorePossible,
      finalState: completeDto.finalGameState,
    });

    // Optionally: Compress old replays
    if (completeDto.shouldCompress) {
      await this.compressionService.compressReplay(replay.id);
    }

    return {
      sessionCompleted: true,
      replay,
    };
  }
}
```

## Usage Examples

### Example 1: Recording a Puzzle Attempt

```typescript
// Start puzzle
POST /game-sessions
{
  "puzzleId": "puzzle-123",
  "puzzleTitle": "Logic Puzzle #42",
  "puzzleCategory": "logic",
  "puzzleDifficulty": "medium",
  "initialGameState": {
    "board": [[1, 2], [3, 4]],
    "moves": 0
  }
}

Response:
{
  "sessionId": "session-456",
  "replayId": "replay-789"
}

// Record player move at 2 seconds
POST /game-sessions/session-456/action
{
  "actionType": "MOVE",
  "timestamp": 2000,
  "actionData": { "from": [0, 0], "to": [1, 1] },
  "stateBefore": { "board": [[1, 2], [3, 4]], "moves": 0 },
  "stateAfter": { "board": [[2, 1], [3, 4]], "moves": 1 },
  "duration": 1200,
  "confidence": 75
}

// Record hint usage at 5 seconds
POST /game-sessions/session-456/action
{
  "actionType": "HINT_USED",
  "timestamp": 5000,
  "actionData": { "hintId": "hint-1", "text": "Try moving top-left..." },
  "metadata": { "hintsRemaining": 2 }
}

// Complete puzzle at 8 seconds
POST /game-sessions/session-456/complete
{
  "isSolved": true,
  "totalDuration": 8000,
  "activeTime": 7500,
  "scoreEarned": 85,
  "maxScorePossible": 100,
  "finalGameState": { "board": [[1, 2, 3], [4, 5, 6]], "solved": true }
}
```

### Example 2: Viewing Replay

```typescript
// Get replay data for playback
GET /replays/replay-789/playback

Response:
{
  "metadata": {
    "replayId": "replay-789",
    "puzzleTitle": "Logic Puzzle #42",
    "puzzleCategory": "logic",
    "puzzleDifficulty": "medium",
    "playerUserId": "user-123",
    "isSolved": true,
    "totalDuration": 8000,
    "activeTime": 7500,
    "movesCount": 2,
    "hintsUsed": 1,
    "scoreEarned": 85,
    "efficiency": 85,
    "completedAt": "2026-02-21T10:30:00Z",
    "initialState": { "board": [[1, 2], [3, 4]], "moves": 0 },
    "finalState": { "board": [[1, 2, 3], [4, 5, 6]], "solved": true }
  },
  "actions": [
    {
      "id": "action-1",
      "sequenceNumber": 0,
      "actionType": "MOVE",
      "timestamp": 2000,
      "actionData": { "from": [0, 0], "to": [1, 1] },
      "stateBefore": { "board": [[1, 2], [3, 4]] },
      "stateAfter": { "board": [[2, 1], [3, 4]] },
      "metadata": { "duration": 1200, "confidence": 75 }
    },
    {
      "id": "action-2",
      "sequenceNumber": 1,
      "actionType": "HINT_USED",
      "timestamp": 5000,
      "actionData": { "hintId": "hint-1" },
      "metadata": { "hintsRemaining": 2 }
    }
  ],
  "totalActions": 2
}
```

### Example 3: Sharing a Replay

```typescript
// Share replay with link
PATCH /replays/replay-789/share
{
  "permission": "shared_link",
  "shareExpiredAt": "2026-03-21T00:00:00Z"
}

Response:
{
  "id": "replay-789",
  "permission": "shared_link",
  "shareCode": "ABC123DEF456",
  "shareExpiredAt": "2026-03-21T00:00:00Z"
}

// Share publicly
PATCH /replays/replay-789/share
{
  "permission": "public"
}

// Access shared replay (no auth required)
GET /replays/shared/ABC123DEF456
GET /replays/replay-789/playback

// Get all public replays for a puzzle
GET /replays/puzzle/puzzle-123/public?page=1&limit=10
```

### Example 4: Comparing Attempts

```typescript
// User first solves puzzle (stores as replay-first)
// Later, user attempts same puzzle again (stores as replay-second)

// Compare the two attempts
POST /replays/compare
{
  "originalReplayId": "replay-first",
  "newReplayId": "replay-second"
}

Response:
{
  "originalReplayId": "replay-first",
  "newReplayId": "replay-second",
  "actionDifferences": {
    "totalDifferenceCount": 3,
    "insertedActions": 1,
    "removedActions": 1,
    "modifiedActions": 1,
    "differenceDetails": [
      {
        "sequenceNumber": 0,
        "changeType": "modified",
        "originalAction": { "type": "MOVE", "data": {...} },
        "newAction": { "type": "MOVE", "data": {...} }
      }
    ]
  },
  "timingComparison": {
    "originalDuration": 15000,
    "newDuration": 8000,
    "timeSavings": 7000,
    "timeSavingsPercentage": 46.67
  },
  "performanceComparison": {
    "originalScore": 70,
    "newScore": 95,
    "scoreImprovement": 25,
    "scoreImprovementPercentage": 35.71,
    "hintsReduction": 1,
    "efficiencyGain": 25
  },
  "learningMetrics": {
    "optimizationLevel": 80.36,
    "strategyImprovement": true,
    "mistakesReduced": true,
    "averageMoveDuration": {
      "original": 750,
      "new": 500,
      "change": -250
    }
  }
}

// Get summary
GET /replays/compare/replay-first/replay-second/summary

Response:
{
  "improved": true,
  "improvementAreas": [
    "Score increased",
    "Required fewer hints",
    "Solved faster"
  ],
  "areasForImprovement": []
}
```

### Example 5: Analytics

```typescript
// Record difficulty rating
POST /replays/replay-789/difficulty-rating
{ "rating": 4 }

// Record learning from this replay
POST /replays/replay-789/learning-effectiveness
{ "beforeScore": 50, "afterScore": 85 }

// Get puzzle completion stats
GET /analytics/puzzles/puzzle-123/completion

Response:
{
  "totalReplays": 1250,
  "completedReplays": 987,
  "solvedReplays": 876,
  "completionRate": 78.96,
  "solveRate": 70.08,
  "averageTime": 240000,
  "averageScore": 82.5
}

// Get top learning replays
GET /analytics/puzzles/puzzle-123/top-replays?limit=5

Response: [
  {
    "replayId": "replay-best-1",
    "viewCount": 250
  },
  {
    "replayId": "replay-best-2",
    "viewCount": 180
  }
]

// Get learning effectiveness
GET /analytics/puzzles/puzzle-123/learning-effectiveness

Response:
{
  "averageImprovement": 15.5,
  "totalViews": 1400,
  "improvementRate": 72.3
}

// Get player progress
GET /analytics/users/user-123/progress

Response: [
  {
    "puzzleId": "puzzle-456",
    "puzzleTitle": "Logic Puzzle #1",
    "firstAttemptScore": 60,
    "bestScore": 95,
    "improvement": 35,
    "attempts": 5,
    "lastAttemptDate": "2026-02-20T15:30:00Z"
  }
]
```

## Step-by-Step Playback Implementation

Frontend implementation for step-by-step replay:

```typescript
class ReplayPlayer {
  private replay: ReplayPlaybackDto;
  private currentActionIndex = 0;
  private animationDuration = 500; // ms per action

  async loadReplay(replayId: string) {
    const response = await fetch(`/replays/${replayId}/playback`);
    this.replay = await response.json();
  }

  play() {
    this.animateActions(0);
  }

  private animateActions(index: number) {
    if (index >= this.replay.actions.length) {
      this.onReplayComplete();
      return;
    }

    const action = this.replay.actions[index];
    const nextAction = this.replay.actions[index + 1];

    // Calculate delay until next action
    const delay = nextAction 
      ? nextAction.timestamp - action.timestamp 
      : 1000;

    // Render action
    this.renderAction(action);

    // Schedule next action
    setTimeout(() => {
      this.animateActions(index + 1);
    }, Math.max(delay, this.animationDuration));
  }

  private renderAction(action: PlaybackActionDto) {
    switch (action.actionType) {
      case 'MOVE':
        this.renderMove(action.actionData);
        break;
      case 'HINT_USED':
        this.showHint(action.actionData);
        break;
      case 'STATE_CHANGE':
        this.updateState(action.stateAfter);
        break;
    }
  }

  seekTo(timestamp: number) {
    // Find the action at this timestamp
    const actionIndex = this.replay.actions.findIndex(
      (a) => a.timestamp >= timestamp
    );
    this.currentActionIndex = actionIndex;

    // Reconstruct state up to this point
    let state = { ...this.replay.metadata.initialState };
    for (let i = 0; i < actionIndex; i++) {
      const action = this.replay.actions[i];
      if (action.stateAfter) {
        state = { ...state, ...action.stateAfter };
      }
    }

    this.updateState(state);
  }

  private updateState(state: any) {
    // Update game UI with current state
  }

  private onReplayComplete() {
    // Replay finished
  }
}
```

## Error Handling

```typescript
try {
  const replay = await replayService.getReplay(replayId);
} catch (error) {
  if (error instanceof NotFoundException) {
    // Replay not found
    res.status(404).json({ message: 'Replay not found' });
  }
}

try {
  await replayService.shareReplay(replayId, userId, shareDto);
} catch (error) {
  if (error instanceof BadRequestException) {
    // Invalid permission or share settings
    res.status(400).json({ message: 'Invalid share configuration' });
  }
}
```

## Performance Tips

1. **Use pagination** for listing replays: `?page=1&limit=20`
2. **Compress old replays** regularly: `PATCH /replays/:id/compress`
3. **Archive after 90 days**: Automatic via scheduled job
4. **Cache public replays** in CDN
5. **Lazy load playback data**: Load actions on demand
6. **Use delta compression** for state storage

## Maintenance

### Scheduled Tasks

Create a cron job for maintenance:

```typescript
@Cron('0 0 * * *') // Daily at midnight
async maintenanceJob() {
  // Archive old replays
  const archivedCount = await this.replayService.archiveOldReplays(90);
  
  // Clean up old analytics
  const deletedAnalytics = await this.analyticsService.cleanupOldAnalytics(180);
  
  logger.log(`Archived ${archivedCount} replays, deleted ${deletedAnalytics} analytics entries`);
}
```

## Troubleshooting

### Replay playback shows incorrect state
- Verify `stateBefore` and `stateAfter` are properly set for each action
- Check delta compression is correctly reconstructing states
- Ensure actions are in correct sequence order

### High storage usage
- Run compression: `PATCH /replays/:id/compress`
- Archive old replays: `archiveOldReplays(90)`
- Check `storageSize` metric in database

### Slow replay loading
- Add database indexes on frequently queried columns (already done)
- Implement caching for popular replays
- Use pagination when listing replays

### Share code not working
- Check share expiration: `shareExpiredAt > NOW()`
- Verify permission: must be 'shared_link' or 'public'
- Ensure share code is unique
