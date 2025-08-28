export interface PlayerPerformance {
  playerId: string;
  puzzleId: string;
  solveTime: number;
  hintsUsed: number;
  success: boolean;
  timestamp: Date;
}

export interface PuzzleFeatures {
  puzzleId: string;
  type: string;
  estimatedSolveTime: number;
  historicalSuccessRate: number;
}
