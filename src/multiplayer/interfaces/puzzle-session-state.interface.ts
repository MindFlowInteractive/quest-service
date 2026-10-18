import { PuzzlePlayerStatus } from '../enums/puzzle-player-status.enum';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';

export interface PuzzleSessionPlayerState {
  userId: string;
  status: PuzzlePlayerStatus;
  connected: boolean;
  score: number;
  progress: number;
  role: PuzzlePlayerRole;
  contributions: number;
  contributionPoints: number;
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
    /**
     * Which player solved each step. Used to credit contributions and to
     * evaluate "distinct contributors" win conditions.
     */
    stepContributors: Record<string, string>;
  };
  partialSolutions: Record<string, PartialSolutionState>;
  updatedAt: string;
}
