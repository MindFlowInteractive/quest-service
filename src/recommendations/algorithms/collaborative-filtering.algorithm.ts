import { Injectable } from '@nestjs/common';
import { SimilarityCalculatorService, UserSimilarity } from './similarity-calculator.service';
import { UserInteractionRepository } from '../data-access/user-interaction.repository';
import { UserInteraction } from '../entities/user-interaction.entity';

export interface CollaborativeRecommendation {
  puzzleId: string;
  score: number;
  reason: string;
  similarUsers: string[];
}

@Injectable()
export class CollaborativeFilteringAlgorithm {
  constructor(
    private similarityCalculator: SimilarityCalculatorService,
    private userInteractionRepo: UserInteractionRepository,
  ) {}

  async generateRecommendations(
    userId: string,
    limit: number = 10,
    category?: string,
    difficulty?: string,
  ): Promise<CollaborativeRecommendation[]> {
    // Get user's interaction history
    const userInteractions = await this.userInteractionRepo.findUserCompletions(userId);
    
    if (userInteractions.length < 3) {
      return []; // Not enough data for collaborative filtering
    }

    // Find similar users
    const similarUsers = await this.findSimilarUsers(userId, userInteractions);
    
    if (similarUsers.length === 0) {
      return [];
    }

    // Get recommendations based on similar users
    return this.getRecommendationsFromSimilarUsers(
      userId,
      similarUsers,
      limit,
      category,
      difficulty,
    );
  }

  private async findSimilarUsers(
    userId: string,
    userInteractions: UserInteraction[],
  ): Promise<UserSimilarity[]> {
    const userPuzzleIds = userInteractions.map(i => i.puzzleId);
    
    if (userPuzzleIds.length === 0) {
      return [];
    }

    // Find users who have completed similar puzzles
    const similarUserData = await this.userInteractionRepo.findSimilarUserInteractions(
      userPuzzleIds,
      userId,
      2, // minimum common puzzles
      50, // limit similar users
    );

    // Calculate Jaccard similarity
    const similarities: UserSimilarity[] = [];
    
    for (const similarUser of similarUserData) {
      const otherUserPuzzles = similarUser.puzzleIds;
      const similarity = this.similarityCalculator.calculateJaccardSimilarity(
        userPuzzleIds,
        otherUserPuzzles,
      );
      
      if (similarity > 0.1) { // Minimum similarity threshold
        similarities.push({
          userId: similarUser.userId,
          similarity,
        });
      }
    }

    return this.similarityCalculator.getTopKSimilar(similarities, 20);
  }

  private async getRecommendationsFromSimilarUsers(
    userId: string,
    similarUsers: UserSimilarity[],
    limit: number,
    category?: string,
    difficulty?: string,
  ): Promise<CollaborativeRecommendation[]> {
    const userCompletedPuzzles = await this.userInteractionRepo.getCompletedPuzzleIds(userId);
    const candidatePuzzles = new Map<string, {
      totalScore: number;
      totalWeight: number;
      contributingUsers: string[];
      puzzleInfo?: any;
    }>();

    // Collect puzzle recommendations from similar users
    for (const similarUser of similarUsers) {
      const similarUserInteractions = await this.userInteractionRepo.findUserCompletions(
        similarUser.userId,
        50,
      );

      for (const interaction of similarUserInteractions) {
        const puzzleId = interaction.puzzleId;
        
        // Skip if user already completed this puzzle
        if (userCompletedPuzzles.includes(puzzleId)) {
          continue;
        }

        // Apply filters
        if (category && interaction.puzzle?.category !== category) {
          continue;
        }
        
        if (difficulty && interaction.puzzle?.difficulty !== difficulty) {
          continue;
        }

        // Calculate weighted score
        const rating = interaction.value || 3.5; // Default rating if not provided
        const weight = similarUser.similarity;
        
        if (!candidatePuzzles.has(puzzleId)) {
          candidatePuzzles.set(puzzleId, {
            totalScore: 0,
            totalWeight: 0,
            contributingUsers: [],
            puzzleInfo: interaction.puzzle,
          });
        }

        const candidate = candidatePuzzles.get(puzzleId)!;
        candidate.totalScore += rating * weight;
        candidate.totalWeight += weight;
        candidate.contributingUsers.push(similarUser.userId);
      }
    }

    // Convert to recommendations and score
    const recommendations: CollaborativeRecommendation[] = [];

    for (const [puzzleId, candidate] of candidatePuzzles) {
      if (candidate.totalWeight > 0 && candidate.contributingUsers.length >= 2) {
        const finalScore = candidate.totalScore / candidate.totalWeight;
        const normalizedScore = Math.min(finalScore / 5.0, 1.0); // Normalize to 0-1

        recommendations.push({
          puzzleId,
          score: normalizedScore,
          reason: `Recommended by ${candidate.contributingUsers.length} similar users with ${(candidate.totalWeight * 100).toFixed(0)}% confidence`,
          similarUsers: candidate.contributingUsers,
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}