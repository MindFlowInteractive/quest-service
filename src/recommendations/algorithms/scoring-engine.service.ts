import { Injectable } from '@nestjs/common';

export interface ScoringWeights {
  collaborative: number;
  contentBased: number;
  popularity: number;
  quality: number;
  recency: number;
}

export interface PuzzleFeatures {
  category: string;
  difficulty: string;
  difficultyRating: number;
  tags: string[];
  averageRating: number;
  completionRate: number;
  ageInDays: number;
}

@Injectable()
export class ScoringEngineService {
  private readonly defaultWeights: ScoringWeights = {
    collaborative: 0.4,
    contentBased: 0.3,
    popularity: 0.15,
    quality: 0.1,
    recency: 0.05,
  };

  /**
   * Combine multiple recommendation scores using weighted average
   */
  combineScores(
    scores: { [algorithm: string]: number },
    weights: Partial<ScoringWeights> = {},
  ): number {
    const finalWeights = { ...this.defaultWeights, ...weights };
    let totalScore = 0;
    let totalWeight = 0;

    for (const [algorithm, score] of Object.entries(scores)) {
      const weight = finalWeights[algorithm as keyof ScoringWeights] || 0;
      if (weight > 0 && score > 0) {
        totalScore += score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate quality score based on puzzle metrics
   */
  calculateQualityScore(features: PuzzleFeatures): number {
    const ratingScore = features.averageRating / 5.0;
    const completionScore = Math.min(features.completionRate, 1.0);
    
    // Penalize puzzles that are too easy (completion rate > 90%) or too hard (< 10%)
    const difficultyBalance = this.calculateDifficultyBalance(features.completionRate);
    
    return (ratingScore * 0.5 + completionScore * 0.3 + difficultyBalance * 0.2);
  }

  /**
   * Calculate popularity score with time decay
   */
  calculatePopularityScore(
    completions: number,
    ageInDays: number,
    maxCompletions: number = 1000,
  ): number {
    const normalizedCompletions = Math.min(completions / maxCompletions, 1.0);
    const timeDecay = Math.exp(-ageInDays / 30); // Decay over 30 days
    
    return normalizedCompletions * (0.7 + 0.3 * timeDecay);
  }

  /**
   * Calculate recency boost for newer puzzles
   */
  calculateRecencyBoost(ageInDays: number): number {
    if (ageInDays <= 7) return 1.0; // New puzzles get full boost
    if (ageInDays <= 30) return 0.8; // Recent puzzles get partial boost
    if (ageInDays <= 90) return 0.5; // Older puzzles get small boost
    return 0.2; // Very old puzzles get minimal boost
  }

  /**
   * Apply diversity penalty to avoid recommending too many similar puzzles
   */
  applyDiversityPenalty(
    scores: Array<{ puzzleId: string; category: string; score: number }>,
    diversityWeight: number = 0.1,
  ): Array<{ puzzleId: string; category: string; score: number }> {
    const categoryCount = new Map<string, number>();
    
    return scores.map((item, index) => {
      const currentCount = categoryCount.get(item.category) || 0;
      categoryCount.set(item.category, currentCount + 1);
      
      // Apply penalty based on how many puzzles from this category we've already seen
      const diversityPenalty = Math.pow(0.9, currentCount);
      const adjustedScore = item.score * (1 - diversityWeight + diversityWeight * diversityPenalty);
      
      return {
        ...item,
        score: adjustedScore,
      };
    });
  }

  /**
   * Normalize scores to 0-1 range
   */
  normalizeScores(scores: number[]): number[] {
    if (scores.length === 0) return [];
    
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;
    
    if (range === 0) return scores.map(() => 0.5);
    
    return scores.map(score => (score - minScore) / range);
  }

  /**
   * Apply sigmoid function to smooth score distribution
   */
  applySigmoid(score: number, steepness: number = 1): number {
    return 1 / (1 + Math.exp(-steepness * (score - 0.5)));
  }

  private calculateDifficultyBalance(completionRate: number): number {
    // Optimal completion rate is around 60-80%
    const optimal = 0.7;
    const distance = Math.abs(completionRate - optimal);
    return Math.max(0, 1 - distance * 2);
  }
}