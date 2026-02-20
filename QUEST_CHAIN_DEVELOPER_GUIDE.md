# Quest Chain System Developer Guide

## System Architecture

The Quest Chain system is built using NestJS with TypeORM and PostgreSQL. It follows a modular architecture with clear separation of concerns:

```
src/quests/
├── entities/                    # Database entities
│   ├── quest-chain.entity.ts
│   ├── quest-chain-puzzle.entity.ts
│   └── user-quest-chain-progress.entity.ts
├── services/                    # Business logic
│   ├── quest-chain.service.ts
│   ├── quest-chain-progression.service.ts
│   └── quest-chain-validation.service.ts
├── controllers/                 # API endpoints
│   ├── quest-chain.controller.ts
│   └── quest-chain-progress.controller.ts
├── dto/                         # Data transfer objects
│   ├── create-quest-chain.dto.ts
│   ├── update-quest-chain.dto.ts
│   ├── add-puzzle-to-chain.dto.ts
│   ├── puzzle-completion.dto.ts
│   └── get-quest-chains.dto.ts
├── __tests__/                   # Unit tests
│   ├── quest-chain.service.spec.ts
│   ├── quest-chain-progression.service.spec.ts
│   └── quest-chain-validation.service.spec.ts
└── quests.module.ts             # Module definition
```

## Core Concepts

### Quest Chain
A quest chain is a sequence of puzzles that players complete in a specific order. Each chain has:
- Story elements with chapters and narrative
- Reward system for completion and milestones
- Time-based availability (optional)
- Validation rules for structure integrity

### Quest Chain Puzzle
Represents the relationship between a puzzle and its position in a quest chain:
- Sequence order for progression
- Unlock conditions that must be met
- Branch conditions for alternative paths
- Checkpoint configuration with rewards

### User Progress
Tracks individual player progress through quest chains:
- Current position and status
- Completed puzzles and scores
- Checkpoint data and branch decisions
- Cumulative statistics

## Implementation Details

### Database Schema

#### quest_chains
```sql
CREATE TABLE quest_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  story JSONB NOT NULL,
  rewards JSONB DEFAULT '{}',
  completionCount INTEGER DEFAULT 0,
  startsAt TIMESTAMP WITH TIME ZONE,
  endsAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP WITH TIME ZONE
);
```

#### quest_chain_puzzles
```sql
CREATE TABLE quest_chain_puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questChainId UUID NOT NULL REFERENCES quest_chains(id) ON DELETE CASCADE,
  puzzleId UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  sequenceOrder INTEGER NOT NULL,
  unlockConditions JSONB DEFAULT '{}',
  branchConditions JSONB DEFAULT '[]',
  isCheckpoint BOOLEAN DEFAULT false,
  checkpointRewards JSONB DEFAULT '{}',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### user_quest_chain_progress
```sql
CREATE TABLE user_quest_chain_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  questChainId UUID NOT NULL REFERENCES quest_chains(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started',
  currentPuzzleIndex INTEGER DEFAULT 0,
  completedPuzzleIds TEXT[] DEFAULT '{}',
  checkpointData JSONB DEFAULT '{}',
  branchPath JSONB DEFAULT '{}',
  totalScore INTEGER DEFAULT 0,
  totalTime INTEGER DEFAULT 0,
  totalHintsUsed INTEGER DEFAULT 0,
  startedAt TIMESTAMP WITH TIME ZONE,
  completedAt TIMESTAMP WITH TIME ZONE,
  lastPlayedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Service Layer

### QuestChainService
Handles CRUD operations for quest chains:
- `createChain()` - Create new quest chain
- `getChainById()` - Retrieve chain by ID
- `getChains()` - List chains with filtering
- `updateChain()` - Update chain properties
- `deleteChain()` - Delete chain
- `addPuzzleToChain()` - Add puzzle to chain
- `removePuzzleFromChain()` - Remove puzzle from chain
- `getChainPuzzles()` - Get all puzzles in chain
- `validateChainStructure()` - Validate chain integrity

### QuestChainProgressionService
Manages user progression through chains:
- `startChain()` - Initialize user progress
- `getProgress()` - Get current progress
- `getNextPuzzle()` - Find next available puzzle
- `completePuzzle()` - Process puzzle completion
- `checkUnlockConditions()` - Validate unlock requirements
- `evaluateBranchConditions()` - Process branching logic
- `resetProgress()` - Reset user progress

### QuestChainValidationService
Validates chain structure and integrity:
- `validateChainStructure()` - Comprehensive validation
- `validateSequentialOrder()` - Check sequence continuity
- `validateUnlockConditions()` - Validate unlock rules
- `validateBranchConditions()` - Validate branching logic
- `validateStoryStructure()` - Validate narrative elements
- `validateRewardsStructure()` - Validate reward configuration
- `detectCircularDependencies()` - Check for cycles

## Key Features Implementation

### Sequential Unlocking
```typescript
// In QuestChainProgressionService
checkUnlockConditions(chainPuzzle: QuestChainPuzzle, userProgress: UserQuestChainProgress): boolean {
  const { unlockConditions } = chainPuzzle;
  
  if (!unlockConditions) return true;

  // Check previous puzzles completed
  if (unlockConditions.previousPuzzles) {
    const allPreviousCompleted = unlockConditions.previousPuzzles.every(puzzleId =>
      userProgress.completedPuzzleIds.includes(puzzleId)
    );
    if (!allPreviousCompleted) return false;
  }

  // Check minimum score
  if (unlockConditions.minimumScore && userProgress.totalScore < unlockConditions.minimumScore) {
    return false;
  }

  // Check time limit
  if (unlockConditions.timeLimit && userProgress.totalTime > unlockConditions.timeLimit) {
    return false;
  }

  return true;
}
```

### Branching Logic
```typescript
// In QuestChainProgressionService
evaluateBranchConditions(chainPuzzle: QuestChainPuzzle, completionData: PuzzleCompletionDto): string | null {
  const { branchConditions } = chainPuzzle;
  
  if (!branchConditions || branchConditions.length === 0) {
    return null;
  }

  for (const condition of branchConditions) {
    let valueToCheck: number;
    
    switch (condition.conditionType) {
      case 'score':
        valueToCheck = completionData.score;
        break;
      case 'time':
        valueToCheck = completionData.timeTaken;
        break;
      case 'accuracy':
        const maxHints = (chainPuzzle.puzzle as any).maxHints || 3;
        valueToCheck = ((maxHints - completionData.hintsUsed) / maxHints) * 100;
        break;
      default:
        continue;
    }

    const meetsCondition = this.evaluateCondition(valueToCheck, condition.operator, condition.value);
    if (meetsCondition) {
      return condition.nextPuzzleId;
    }
  }

  return null;
}
```

### Progress Checkpointing
```typescript
// In QuestChainProgressionService.completePuzzle()
if (chainPuzzle.isCheckpoint) {
  progress.checkpointData[puzzleId] = {
    completedAt: new Date(),
    score: completionData.score,
    timeTaken: completionData.timeTaken,
    hintsUsed: completionData.hintsUsed,
  };
  
  // Award checkpoint rewards
  await this.awardRewards(userId, chainId, 'checkpoint');
}
```

## Integration Points

### With Puzzle Service
The system integrates with existing puzzle entities through:
- Foreign key relationships in `quest_chain_puzzles`
- Extension of `Puzzle` entity with `questChainReferences`
- Shared puzzle data and metadata

### With User Progress Service
Integration with user progress tracking:
- Extension of `UserProgress` entity with `questChainStats`
- Shared user ID references
- Cumulative statistics tracking

### With Reward System
Reward distribution through:
- Completion rewards configuration
- Checkpoint reward system
- Milestone-based rewards
- Integration with existing economy system

## Testing Strategy

### Unit Tests
Located in `src/quests/__tests__/`:
- Service method testing with mocked repositories
- Business logic validation
- Edge case handling
- Error condition testing

### Integration Tests
- Database operation testing
- API endpoint validation
- Cross-service integration
- Performance testing

### Test Coverage Areas
- Chain creation and validation
- Progression logic
- Unlock condition evaluation
- Branching path selection
- Reward distribution
- Error handling

## Performance Considerations

### Database Optimization
- Indexes on frequently queried fields
- Proper foreign key constraints
- JSONB fields for flexible data structures
- Pagination for large result sets

### Caching Strategy
- Chain metadata caching
- User progress caching
- Puzzle availability caching
- Validation result caching

### Query Optimization
- Efficient joins and eager loading
- Proper use of query builders
- Batch operations where possible
- Connection pooling configuration

## Security Considerations

### Input Validation
- DTO validation with class-validator
- Sanitization of user inputs
- Type checking for all parameters
- JSON schema validation

### Authorization
- User ownership verification
- Chain access control
- Progress modification restrictions
- Rate limiting on progression endpoints

### Data Integrity
- Transaction management
- Cascade delete handling
- Constraint validation
- Audit logging

## Deployment Considerations

### Environment Configuration
- Database connection settings
- Migration run configuration
- Logging levels
- Cache configuration

### Monitoring
- Performance metrics
- Error rate tracking
- Database query performance
- User engagement metrics

### Scaling
- Horizontal scaling support
- Database read replicas
- Caching layer implementation
- Load balancing configuration

## Common Patterns and Best Practices

### Error Handling
```typescript
try {
  return await this.questChainRepository.save(chain);
} catch (error) {
  throw new BadRequestException(`Failed to create quest chain: ${error.message}`);
}
```

### Validation Before Operations
```typescript
const existingChainPuzzle = await this.questChainPuzzleRepository.findOne({
  where: { questChainId: chainId, puzzleId: puzzleId },
});

if (existingChainPuzzle) {
  throw new BadRequestException('Puzzle already exists in this quest chain');
}
```

### Proper Transaction Handling
```typescript
// Use database transactions for critical operations
await queryRunner.startTransaction();
try {
  // Multiple related operations
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
}
```

## Troubleshooting

### Common Issues
1. **Circular Dependencies**: Use validation service to detect cycles
2. **Unlock Condition Failures**: Check puzzle IDs and sequence order
3. **Branching Logic Issues**: Validate condition types and values
4. **Performance Problems**: Check database indexes and query patterns

### Debugging Tips
- Enable detailed logging
- Use database query logging
- Monitor memory usage
- Check connection pool statistics

## Future Enhancements

### Planned Features
- Advanced branching conditions
- Dynamic difficulty scaling
- Social features (leaderboards, sharing)
- Analytics and reporting
- Mobile app integration

### Architecture Improvements
- Microservice decomposition
- Event-driven architecture
- Advanced caching strategies
- Real-time progress synchronization