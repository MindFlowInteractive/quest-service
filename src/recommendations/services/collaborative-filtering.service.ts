import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInteraction } from '../entities/user-interaction.entity';
import { PuzzleRating } from '../../puzzles/entities/puzzle-rating.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

interface UserSimilarity {
  userId: string;
  similarity: number;
}

interface PuzzleScore {
  puzzleId: string;
  score: number;
  reason: string;
}

@Injectable()
export class CollaborativeFilteringService {
  constructor(
    @InjectRepository(UserInteraction)
    private userInteractionRepository: Repository<UserInteraction>,
    @InjectRepository(PuzzleRating)
    private puzzleRatingRepository: Repository<PuzzleRating>,
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
  ) {}

  async generateRecommendations(
    userId: string,
    limit: number = 10,
    category?: string,
    difficulty?: string,
  ): Promise<PuzzleScore[]> {
    // Get user's interaction history
    const userInteractions = await this.getUserInteractions(userId);
    
    if (userInteractions.length < 3) {
      // Not enough data for collaborative filtering
      return [];
    }

    // Find similar users
    const similarUsers = await this.findSimilarUsers(userId, userInteractions);
    
    if (similarUsers.length === 0) {
      return [];
    }

    // Get recommendations based on similar users
    const recommendations = await this.getRecommendationsFromSimilarUsers(
      userId,
      similarUsers,
      limit,
      category,
      difficulty,
    );

    return recommendations;
  }

  private async getUserInteractions(userId: string): Promise<UserInteraction[]> {
    return this.userInteractionRepository.find({
      where: { 
        userId,
        interactionType: 'complete' // Focus on completed puzzles
      },
      relations: ['puzzle'],
      order: { createdAt: 'DESC' },
      take: 100, // Limit to recent interactions
    });
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
    const similarUserInteractions = await this.userInteractionRepository
      .createQueryBuilder('interaction')
      .select('interaction.userId', 'userId')
      .addSelect('COUNT(*)', 'commonPuzzles')
      .addSelect('array_agg(interaction.puzzleId)', 'puzzleIds')
      .where('interaction.puzzleId IN (:...puzzleIds)', { puzzleIds: userPuzzleIds })
      .andWhere('interaction.userId != :userId', { userId })
      .andWhere('interaction.interactionType = :type', { type: 'complete' })
      .groupBy('interaction.userId')
      .having('COUNT(*) >= :minCommon', { minCommon: 2 })
      .orderBy('COUNT(*)', 'DESC')
      .limit(50)
      .getRawMany();

    // Calculate Jaccard similarity
    const similarities: UserSimilarity[] = [];
    
    for (const similarUser of similarUserInteractions) {
      const otherUserPuzzles = similarUser.puzzleIds;
      const intersection = userPuzzleIds.filter(id => otherUserPuzzles.includes(id));
      const union = [...new Set([...userPuzzleIds, ...otherUserPuzzles])];
      
      const similarity = intersection.length / union.length;
      
      if (similarity > 0.1) { // Minimum similarity threshold
        similarities.push({
          userId: similarUser.userId,
          similarity,
        });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20); // Top 20 similar users
  }

  private async getRecommendationsFromSimilarUsers(
    userId: string,
    similarUsers: UserSimilarity[],
    limit: number,
    category?: string,
    difficulty?: string,
  ): Promise<PuzzleScore[]> {
    const userCompletedPuzzles = await this.getUserCompletedPuzzles(userId);
    const similarUserIds = similarUsers.map(u => u.userId);

    // Get puzzles completed by similar users but not by current user
    let query = this.userInteractionRepository
      .createQueryBuilder('interaction')
      .innerJoin('interaction.puzzle', 'puzzle')
      .select('interaction.puzzleId', 'puzzleId')
      .addSelect('COUNT(*)', 'completionCount')
      .addSelect('AVG(interaction.value)', 'avgRating')
      .addSelect('puzzle.title', 'title')
      .addSelect('puzzle.category', 'category')
      .addSelect('puzzle.difficulty', 'difficulty')
      .addSelect('puzzle.averageRating', 'puzzleRating')
      .where('interaction.userId IN (:...userIds)', { userIds: similarUserIds })
      .andWhere('interaction.interactionType = :type', { type: 'complete' })
      .andWhere('interaction.puzzleId NOT IN (:...completedPuzzles)', { 
        completedPuzzles: userCompletedPuzzles.length > 0 ? userCompletedPuzzles : [''] 
      })
      .andWhere('puzzle.isActive = :active', { active: true });

    if (category) {
      query = query.andWhere('puzzle.category = :category', { category });
    }

    if (difficulty) {
      query = query.andWhere('puzzle.difficulty = :difficulty', { difficulty });
    }

    const candidatePuzzles = await query
      .groupBy('interaction.puzzleId')
      .addGroupBy('puzzle.title')
      .addGroupBy('puzzle.category')
      .addGroupBy('puzzle.difficulty')
      .addGroupBy('puzzle.averageRating')
      .having('COUNT(*) >= :minCompletions', { minCompletions: 2 })
      .orderBy('COUNT(*)', 'DESC')
      .addOrderBy('puzzle.averageRating', 'DESC')
      .limit(limit * 2) // Get more candidates for scoring
      .getRawMany();

    // Score puzzles based on similar user preferences
    const scoredPuzzles: PuzzleScore[] = [];

    for (const puzzle of candidatePuzzles) {
      let weightedScore = 0;
      let totalWeight = 0;
      const contributingUsers: string[] = [];

      for (const similarUser of similarUsers) {
        // Check if this similar user completed this puzzle
        const userInteraction = await this.userInteractionRepository.findOne({
          where: {
            userId: similarUser.userId,
            puzzleId: puzzle.puzzleId,
            interactionType: 'complete',
          },
        });

        if (userInteraction) {
          const weight = similarUser.similarity;
          const rating = userInteraction.value || 3.5; // Default rating if not provided
          
          weightedScore += rating * weight;
          totalWeight += weight;
          contributingUsers.push(similarUser.userId);
        }
      }

      if (totalWeight > 0) {
        const finalScore = weightedScore / totalWeight;
        const normalizedScore = Math.min(finalScore / 5.0, 1.0); // Normalize to 0-1

        scoredPuzzles.push({
          puzzleId: puzzle.puzzleId,
          score: normalizedScore,
          reason: `Recommended by ${contributingUsers.length} similar users with ${(totalWeight * 100).toFixed(0)}% confidence`,
        });
      }
    }

    return scoredPuzzles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getUserCompletedPuzzles(userId: string): Promise<string[]> {
    const interactions = await this.userInteractionRepository.find({
      where: { 
        userId,
        interactionType: 'complete'
      },
      select: ['puzzleId'],
    });

    return interactions.map(i => i.puzzleId);
  }
}