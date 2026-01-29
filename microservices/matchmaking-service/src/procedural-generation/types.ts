/**
 * Procedural Puzzle Generation - Type Definitions
 */

export type PuzzleType = 'logic' | 'pattern' | 'math' | 'word' | 'visual';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface GenerationConfig {
  puzzleType: PuzzleType;
  difficulty: DifficultyLevel;
  seed?: number;
  parameters?: Record<string, any>;
  constraints?: GenerationConstraints;
}

export interface GenerationConstraints {
  minSolveTime?: number;
  maxSolveTime?: number;
  requiredElements?: string[];
  excludeElements?: string[];
  maxComplexity?: number;
  uniquenessWindow?: number; // hours
}

export interface GeneratedPuzzle {
  id: string;
  type: PuzzleType;
  difficulty: DifficultyLevel;
  difficultyRating: number; // 1-10
  title: string;
  description: string;
  content: PuzzleContent;
  solution: PuzzleSolution;
  hints: string[];
  timeLimit: number; // seconds
  basePoints: number;
  metadata: GenerationMetadata;
  validationScore: number; // 0-1
  estimatedSolveTime?: number;
  createdAt: Date;
}

export interface PuzzleContent {
  puzzle: any; // Type varies by puzzle type
  format: 'json' | 'text' | 'grid' | 'image';
  resources?: string[];
}

export interface PuzzleSolution {
  answer: any;
  explanation: string;
  steps?: string[];
}

export interface GenerationMetadata {
  generationMethod: string;
  generatedAt: Date;
  seed: number;
  parameterSignature: string;
  qualityMetrics: QualityMetrics;
  solvabilityScore: number;
  engagementScore: number;
}

export interface QualityMetrics {
  complexity: number; // 0-1
  uniqueness: number; // 0-1
  clarity: number; // 0-1
  solvability: number; // 0-1
  engagementPotential: number; // 0-1
}

export interface GenerationResult {
  puzzle: GeneratedPuzzle;
  metrics: QualityMetrics;
  validationPassed: boolean;
  issues: string[];
}

export interface GenerationAlgorithmConfig {
  name: string;
  version: string;
  parameters: AlgorithmParameter[];
  constraints: AlgorithmConstraint[];
}

export interface AlgorithmParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array';
  default: any;
  min?: number;
  max?: number;
  description: string;
}

export interface AlgorithmConstraint {
  name: string;
  condition: (config: GenerationConfig) => boolean;
  message: string;
}

export interface VarietyTracker {
  puzzleType: PuzzleType;
  difficulty: DifficultyLevel;
  recentHashes: string[];
  uniquenessScore: number;
  lastGenerated: Date;
}

export interface GenerationAnalytics {
  totalGenerated: number;
  successRate: number;
  averageQualityScore: number;
  averageGenerationTime: number;
  typeDistribution: Record<PuzzleType, number>;
  difficultyDistribution: Record<DifficultyLevel, number>;
  failureReasons: Record<string, number>;
}

export interface CacheEntry {
  puzzle: GeneratedPuzzle;
  timestamp: Date;
  ttl: number;
  hits: number;
  usageCount: number;
}

export interface ABTestConfig {
  testId: string;
  name: string;
  variant: string; // 'control' | 'treatment'
  algorithm: string;
  parameters: Record<string, any>;
  metrics: string[];
  sampleSize: number;
  startDate: Date;
  endDate?: Date;
  active: boolean;
}

export interface ABTestMetrics {
  testId: string;
  variant: string;
  sampleSize: number;
  successRate: number;
  averageEngagement: number;
  averageCompletionTime: number;
  playerRetention: number;
  qualityScore: number;
  statisticalSignificance: number;
}

export interface GenerationDebugInfo {
  config: GenerationConfig;
  generatedPuzzle: GeneratedPuzzle;
  validationSteps: ValidationStep[];
  issues: DebugIssue[];
  performanceMetrics: PerformanceMetrics;
}

export interface ValidationStep {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

export interface DebugIssue {
  severity: 'info' | 'warning' | 'error';
  message: string;
  context?: any;
  suggestion?: string;
}

export interface PerformanceMetrics {
  generationTime: number;
  validationTime: number;
  totalTime: number;
  memoryUsed: number;
}

export interface UserPreferences {
  userId: string;
  preferredCategories: PuzzleType[];
  difficultyRange: [DifficultyLevel, DifficultyLevel];
  avoidPatterns?: string[];
  preferredThemes?: string[];
  diversityPreference: number; // 0-1
  noveltyPreference: number; // 0-1
  difficultyProgression: 'adaptive' | 'static' | 'ascending';
}

export interface PersonalizationContext {
  userId: string;
  recentPerformance: {
    successRate: number;
    averageSolveTime: number;
    preferredTypes: PuzzleType[];
  };
  skillLevel: number; // 0-10
  playStyle: 'fast' | 'thoughtful' | 'hint-dependent';
  sessionGoal?: 'learning' | 'challenge' | 'relaxation';
}
