import { IsUUID, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for recording an action during gameplay
 */
export class RecordActionDto {
  @IsString()
  actionType: 'MOVE' | 'HINT_USED' | 'STATE_CHANGE' | 'UNDO' | 'SUBMISSION' | 'PAUSE' | 'RESUME';

  @IsNumber()
  timestamp: number; // Milliseconds from replay start

  @IsOptional()
  actionData?: Record<string, any>;

  @IsOptional()
  stateBefore?: Record<string, any>;

  @IsOptional()
  stateAfter?: Record<string, any>;

  @IsOptional()
  metadata?: {
    duration?: number;
    difficulty?: string;
    confidence?: number;
    notes?: string;
  };
}

/**
 * DTO for creating a new replay
 */
export class CreateReplayDto {
  @IsUUID()
  puzzleId: string;

  @IsString()
  puzzleTitle: string;

  @IsString()
  puzzleCategory: string;

  @IsString()
  puzzleDifficulty: 'easy' | 'medium' | 'hard' | 'expert';

  @IsOptional()
  gameSessionId?: string;

  @IsOptional()
  initialState?: Record<string, any>;

  @IsOptional()
  userMetadata?: Record<string, any>;

  @IsOptional()
  sessionMetadata?: Record<string, any>;
}

/**
 * DTO for completing a replay
 */
export class CompleteReplayDto {
  @IsBoolean()
  isSolved: boolean;

  @IsOptional()
  @IsNumber()
  totalDuration?: number;

  @IsOptional()
  @IsNumber()
  activeTime?: number;

  @IsOptional()
  @IsNumber()
  scoreEarned?: number;

  @IsOptional()
  @IsNumber()
  maxScorePossible?: number;

  @IsOptional()
  finalState?: Record<string, any>;
}

/**
 * DTO for sharing a replay
 */
export class ShareReplayDto {
  @IsString()
  permission: 'private' | 'shared_link' | 'public';

  @IsOptional()
  shareExpiredAt?: Date;
}
