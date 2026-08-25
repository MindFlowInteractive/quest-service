import { PuzzlePlayerStatus } from '../enums/puzzle-player-status.enum';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';

export interface PuzzleSessionPlayerState {
  userId: string;
  status: PuzzlePlayerStatus;
  connected: boolean;
  score: number;
  progress: number;
}

export interface PartialSolutionState {
  userId: string;
  content: string;
  stepId?: string;
  confidence?: number;
  updatedAt: string;
}

export interface PuzzleSessionState {
  sessionId: string;
  puzzleId: string;
  version: number;
  status: PuzzleSessionStatus;
  players: Record<string, PuzzleSessionPlayerState>;
  sharedProgress: {
    completedSteps: string[];
    discoveredHints: string[];
    solvedSteps: string[];
  };
  partialSolutions: Record<string, PartialSolutionState>;
  updatedAt: string;
}
