import type {
  PuzzleType,
  PuzzleStatus,
  DifficultyLevel,
  PuzzleMove,
  PuzzleHint,
  ValidationResult,
  CauseEffectResult,
} from "../types/puzzle.types"

export interface IPuzzle {
  id: string
  type: PuzzleType
  title: string
  description: string
  difficulty: DifficultyLevel
  timeLimit?: number
  maxMoves?: number
  tags: string[]
  metadata: Record<string, any>

  // Core methods
  initialize(config?: any): Promise<void>
  reset(): Promise<void>
  makeMove(move: PuzzleMove): Promise<ValidationResult>
  getState(): PuzzleGameState
  setState(state: PuzzleGameState): Promise<void>
  isComplete(): boolean
  isSolvable(): boolean
  generateHint(level: number): Promise<PuzzleHint>
  clone(): IPuzzle
}

export interface PuzzleGameState {
  puzzleId: string
  playerId: string
  status: PuzzleStatus
  currentState: any
  moves: PuzzleMove[]
  startTime: Date
  endTime?: Date
  score: number
  hintsUsed: number
  metadata: Record<string, any> & { // Use intersection to add new fields
    session?: {
      puzzleCount: number;
      lastCompletionTime?: Date;
    };
  };
}

export interface IPuzzleGenerator {
  type: PuzzleType
  generatePuzzle(difficulty: DifficultyLevel, constraints?: any): Promise<IPuzzle>
  validateConfiguration(config: any): boolean
  estimateDifficulty(puzzle: IPuzzle): DifficultyLevel
}

export interface IPuzzleValidator {
  validateMove(puzzle: IPuzzle, move: PuzzleMove): Promise<ValidationResult>
  validateSolution(puzzle: IPuzzle, solution: any): Promise<ValidationResult>
  checkConstraints(puzzle: IPuzzle, state: any): boolean
}

export interface ICauseEffectEngine {
  registerRule(rule: CauseEffectRule): void
  processMove(puzzle: IPuzzle, move: PuzzleMove): Promise<CauseEffectResult[]>
  simulateMove(puzzle: IPuzzle, move: PuzzleMove): Promise<CauseEffectResult[]>
  getCascadeEffects(puzzle: IPuzzle, initialEffects: CauseEffectResult[]): Promise<CauseEffectResult[]>
}

export interface CauseEffectRule {
  id: string
  name: string
  puzzleTypes: PuzzleType[]
  condition: (puzzle: IPuzzle, move: PuzzleMove) => boolean
  effect: (puzzle: IPuzzle, move: PuzzleMove) => Promise<CauseEffectResult[]>
  priority: number
  cascadable: boolean
}

export interface IHintSystem {
  generateHint(puzzle: IPuzzle, level: number, context?: any): Promise<PuzzleHint>
  getAvailableHints(puzzle: IPuzzle): Promise<PuzzleHint[]>
  applyHint(puzzle: IPuzzle, hint: PuzzleHint): Promise<void>
  calculateHintPenalty(hint: PuzzleHint): number
}

export interface IDifficultyScaler {
  calculateDifficulty(playerMetrics: PlayerMetrics, puzzleType: PuzzleType): DifficultyLevel
  adjustDifficulty(currentDifficulty: DifficultyLevel, performance: PerformanceMetrics): DifficultyLevel
  getPuzzleParameters(difficulty: DifficultyLevel, puzzleType: PuzzleType): any
}

export interface PlayerMetrics {
  playerId: string
  totalPuzzlesSolved: number
  averageCompletionTime: number
  successRate: number
  currentStreak: number
  bestStreak: number
  preferredDifficulty: DifficultyLevel
  skillLevels: Record<PuzzleType, number>
  recentPerformance: PerformanceMetrics[]
}

export interface PerformanceMetrics {
  puzzleId: string
  puzzleType: PuzzleType
  difficulty: DifficultyLevel
  completed: boolean
  timeSpent: number
  movesUsed: number
  hintsUsed: number
  score: number
  timestamp: Date
}
