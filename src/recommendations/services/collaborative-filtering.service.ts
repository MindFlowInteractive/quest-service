import { Injectable } from '@nestjs/common';
import { CollaborativeFilteringAlgorithm, CollaborativeRecommendation } from '../algorithms/collaborative-filtering.algorithm';

interface PuzzleScore {
  puzzleId: string;
  score: number;
  reason: string;
}

@Injectable()
export class CollaborativeFilteringService {
  constructor(
    private collaborativeAlgorithm: CollaborativeFilteringAlgorithm,
  ) {}

  async generateRecommendations(
    userId: string,
    limit: number = 10,
    category?: string,
    difficulty?: string,
  ): Promise<PuzzleScore[]> {
    const recommendations = await this.collaborativeAlgorithm.generateRecommendations(
      userId,
      limit,
      category,
      difficulty,
    );

    return recommendations.map(rec => ({
      puzzleId: rec.puzzleId,
      score: rec.score,
      reason: rec.reason,
    }));
  }
}