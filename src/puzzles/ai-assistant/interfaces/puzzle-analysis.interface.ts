export interface PuzzleAnalysis {
  puzzleType: string;
  difficulty: number;
  currentProgress: number;
  identifiedPatterns: string[];
  suggestedStrategies: Strategy[];
  playerMisconceptions?: string[];
}

export interface Strategy {
  name: string;
  description: string;
  applicability: number; // 0-1 score
  prerequisites: string[];
  cognitiveLoad: 'low' | 'medium' | 'high';
}

export interface Hint {
  level: number;
  type: 'observation' | 'question' | 'strategy' | 'pattern';
  content: string;
  reasoning?: string;
  nextSteps?: string[];
  avoidsSolution: boolean;
}

export interface LearningPath {
  currentLevel: string;
  masteredStrategies: string[];
  recommendedPuzzles: string[];
  focusAreas: string[];
  estimatedProgress: number;
}