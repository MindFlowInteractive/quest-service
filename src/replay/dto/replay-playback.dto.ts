import { IsUUID, IsNumber, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for retrieving replay playback data
 */
export class PlaybackMetadataDto {
  replayId: string;
  puzzleTitle: string;
  puzzleCategory: string;
  puzzleDifficulty: string;
  playerUserId: string;
  isSolved: boolean;
  totalDuration: number;
  activeTime: number;
  movesCount: number;
  hintsUsed: number;
  scoreEarned?: number;
  efficiency?: number;
  completedAt?: Date;
  initialState: Record<string, any>;
  finalState?: Record<string, any>;
}

/**
 * DTO for playback action
 */
export class PlaybackActionDto {
  id: string;
  sequenceNumber: number;
  actionType: string;
  timestamp: number;
  actionData: Record<string, any>;
  stateBefore?: Record<string, any>;
  stateAfter?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * DTO for complete replay playback
 */
export class ReplayPlaybackDto {
  metadata: PlaybackMetadataDto;
  actions: PlaybackActionDto[];
  totalActions: number;
}

/**
 * DTO for replay summary (list view)
 */
export class ReplaySummaryDto {
  id: string;
  puzzleId: string;
  puzzleTitle: string;
  puzzleCategory: string;
  puzzleDifficulty: string;
  isCompleted: boolean;
  isSolved: boolean;
  totalDuration: number;
  movesCount: number;
  hintsUsed: number;
  scoreEarned?: number;
  efficiency?: number;
  completedAt?: Date;
  viewCount: number;
  permission: string;
  createdAt: Date;
  lastViewedAt?: Date;
}

/**
 * DTO for replay comparison
 */
export class ReplayComparisonDto {
  originalReplayId: string;
  newReplayId: string;
  actionDifferences: {
    totalDifferenceCount: number;
    insertedActions: number;
    removedActions: number;
    modifiedActions: number;
    differenceDetails: Array<{
      sequenceNumber: number;
      changeType: 'inserted' | 'removed' | 'modified';
      originalAction?: any;
      newAction?: any;
    }>;
  };
  timingComparison: {
    originalDuration: number;
    newDuration: number;
    timeSavings: number;
    timeSavingsPercentage: number;
  };
  performanceComparison: {
    originalScore: number;
    newScore: number;
    scoreImprovement: number;
    scoreImprovementPercentage: number;
    hintsReduction: number;
    efficiencyGain: number;
  };
  learningMetrics: {
    optimizationLevel: number; // 0-100
    strategyImprovement: boolean;
    mistakesReduced: boolean;
    averageMoveDuration: {
      original: number;
      new: number;
      change: number;
    };
  };
}
