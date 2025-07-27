export enum PuzzleType {
  LOGIC_GRID = "logic_grid",
  SEQUENCE = "sequence",
  PATTERN_MATCHING = "pattern_matching",
  SPATIAL = "spatial",
  MATHEMATICAL = "mathematical",
  WORD_PUZZLE = "word_puzzle",
  CUSTOM = "custom",
}

export enum PuzzleStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  ABANDONED = "abandoned",
}

export enum DifficultyLevel {
  BEGINNER = 1,
  EASY = 2,
  MEDIUM = 3,
  HARD = 4,
  EXPERT = 5,
  MASTER = 6,
  LEGENDARY = 7,
  IMPOSSIBLE = 8,
}

export interface PuzzleMove {
  id: string
  timestamp: Date
  playerId: string
  puzzleId: string
  moveType: string
  moveData: any
  isValid: boolean
  causedEffects?: CauseEffectResult[]
}

export interface CauseEffectResult {
  effectId: string
  effectType: string
  targetElements: string[]
  changes: Record<string, any>
  cascadeLevel: number
}

export interface PuzzleHint {
  id: string
  level: number
  type: "visual" | "textual" | "interactive"
  content: string
  targetElements?: string[]
  revealPercentage: number
}

export interface ValidationResult {
  isValid: boolean
  isComplete: boolean
  score: number
  errors: ValidationError[]
  completionPercentage: number
  timeBonus?: number
  perfectSolution?: boolean
}

export interface ValidationError {
  type: string
  message: string
  element?: string
  severity: "low" | "medium" | "high"
}

export interface PuzzleMetrics {
  totalMoves: number
  validMoves: number
  invalidMoves: number
  hintsUsed: number
  timeSpent: number
  completionRate: number
  averageTimePerMove: number
  errorRate: number
}
