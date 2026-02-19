import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBasedFilteringAlgorithm, ContentBasedRecommendation } from '../algorithms/content-based-filtering.algorithm';
import { UserPreference } from '../entities/user-preference.entity';
import { UserInteraction } from '../entities/user-interaction.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

interface PuzzleFeatures {
  category: string;
  difficulty: string;
  difficultyRating: number;
  tags: string[];
  averageRating: number;
  completionRate: number;
}

interface PuzzleScore {
  puzzleId: string;
  score: number;
  reason: string;
}

@Injectable()
export class ContentBasedFilteringService {
  constructor(
    private contentBasedAlgorithm: ContentBasedFilteringAlgorithm,
    @InjectRepository(UserPreference)
    private userPreferenceRepository: Repository<UserPreference>,
    @InjectRepository(UserInteraction)
    private userInteractionRepository: Repository<UserInteraction>,
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
  ) {}

  async generateRecommendations(
    userId: string,
    limit: number = 10,
    category?: string,
    difficulty?: string,
  ): Promise<PuzzleScore[]> {
    // Get or create user preferences
    const userPreferences = await this.getUserPreferences(userId);
    
    // Get user's completed puzzles to avoid recommending them again
    const completedPuzzles = await this.getUserCompletedPuzzles(userId);

    // Get candidate puzzles
    const candidatePuzzles = await this.getCandidatePuzzles(
      completedPuzzles,
      category,
      difficulty,
      limit * 3, // Get more candidates for better scoring
    );

    // Score puzzles based on content similarity
    const scoredPuzzles = await this.scorePuzzles(
      candidatePuzzles,
      userPreferences,
      userId,
    );

    return scoredPuzzles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getUserPreferences(userId: string): Promise<UserPreference[]> {
    let preferences = await this.userPreferenceRepository.find({
      where: { userId },
    });

    // If no preferences exist, create them based on user interactions
    if (preferences.length === 0) {
      preferences = await this.createUserPreferencesFromHistory(userId);
    }

    return preferences;
  }

  private async createUserPreferencesFromHistory(userId: string): Promise<UserPreference[]> {
    const interactions = await this.userInteractionRepository.find({
      where: { 
        userId,
        interactionType: 'complete'
      },
      relations: ['puzzle'],
      take: 50, // Analyze recent completions
    });

    if (interactions.length === 0) {
      return this.createDefaultPreferences(userId);
    }

    // Analyze user's puzzle completion patterns
    const categoryStats = new Map<string, { count: number; totalRating: number; totalTime: number }>();
    const difficultyStats = new Map<string, { count: number; totalRating: number; totalTime: number }>();
    const tagStats = new Map<string, { count: number; totalRating: number }>();

    for (const interaction of interactions) {
      const puzzle = interaction.puzzle;
      const rating = interaction.value || 3.5;
      const completionTime = interaction.metadata?.completionTime || 0;

      // Category preferences
      const categoryKey = puzzle.category;
      if (!categoryStats.has(categoryKey)) {
        categoryStats.set(categoryKey, { count: 0, totalRating: 0, totalTime: 0 });
      }
      const categoryStat = categoryStats.get(categoryKey)!;
      categoryStat.count++;
      categoryStat.totalRating += rating;
      categoryStat.totalTime += completionTime;

      // Difficulty preferences
      const difficultyKey = puzzle.difficulty;
      if (!difficultyStats.has(difficultyKey)) {
        difficultyStats.set(difficultyKey, { count: 0, totalRating: 0, totalTime: 0 });
      }
      const difficultyStat = difficultyStats.get(difficultyKey)!;
      difficultyStat.count++;
      difficultyStat.totalRating += rating;
      difficultyStat.totalTime += completionTime;

      // Tag preferences
      for (const tag of puzzle.tags) {
        if (!tagStats.has(tag)) {
          tagStats.set(tag, { count: 0, totalRating: 0 });
        }
        const tagStat = tagStats.get(tag)!;
        tagStat.count++;
        tagStat.totalRating += rating;
      }
    }

    const preferences: UserPreference[] = [];

    // Create category preferences
    for (const [category, stats] of categoryStats) {
      const avgRating = stats.totalRating / stats.count;
      const avgTime = stats.totalTime / stats.count;
      const preferenceScore = Math.min((avgRating / 5.0) * (stats.count / interactions.length), 1.0);

      const preference = this.userPreferenceRepository.create({
        userId,
        category,
        preferenceScore,
        difficulty: 'medium', // Will be updated with difficulty-specific preferences
        difficultyScore: 0.5,
        tagPreferences: {},
        interactionCount: stats.count,
        averageCompletionTime: avgTime,
        successRate: 1.0, // All interactions are completions
      });

      preferences.push(await this.userPreferenceRepository.save(preference));
    }

    return preferences;
  }

  private async createDefaultPreferences(userId: string): Promise<UserPreference[]> {
    // Create default preferences for new users
    const defaultCategories = ['logic', 'math', 'pattern', 'word'];
    const preferences: UserPreference[] = [];

    for (const category of defaultCategories) {
      const preference = this.userPreferenceRepository.create({
        userId,
        category,
        preferenceScore: 0.5, // Neutral preference
        difficulty: 'medium',
        difficultyScore: 0.5,
        tagPreferences: {},
        interactionCount: 0,
        averageCompletionTime: 0,
        successRate: 0,
      });

      preferences.push(await this.userPreferenceRepository.save(preference));
    }

    return preferences;
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

  private async getCandidatePuzzles(
    excludePuzzleIds: string[],
    category?: string,
    difficulty?: string,
    limit: number = 30,
  ): Promise<Puzzle[]> {
    let query = this.puzzleRepository
      .createQueryBuilder('puzzle')
      .where('puzzle.isActive = :active', { active: true })
      .andWhere('puzzle.publishedAt IS NOT NULL');

    if (excludePuzzleIds.length > 0) {
      query = query.andWhere('puzzle.id NOT IN (:...excludeIds)', { 
        excludeIds: excludePuzzleIds 
      });
    }

    if (category) {
      query = query.andWhere('puzzle.category = :category', { category });
    }

    if (difficulty) {
      query = query.andWhere('puzzle.difficulty = :difficulty', { difficulty });
    }

    return query
      .orderBy('puzzle.averageRating', 'DESC')
      .addOrderBy('puzzle.completions', 'DESC')
      .limit(limit)
      .getMany();
  }

  private async scorePuzzles(
    puzzles: Puzzle[],
    userPreferences: UserPreference[],
    userId: string,
  ): Promise<PuzzleScore[]> {
    const scoredPuzzles: PuzzleScore[] = [];

    for (const puzzle of puzzles) {
      const features = this.extractPuzzleFeatures(puzzle);
      const score = this.calculateContentSimilarity(features, userPreferences);
      const reason = this.generateRecommendationReason(features, userPreferences, score);

      scoredPuzzles.push({
        puzzleId: puzzle.id,
        score,
        reason,
      });
    }

    return scoredPuzzles;
  }

  private extractPuzzleFeatures(puzzle: Puzzle): PuzzleFeatures {
    const completionRate = puzzle.attempts > 0 ? puzzle.completions / puzzle.attempts : 0;

    return {
      category: puzzle.category,
      difficulty: puzzle.difficulty,
      difficultyRating: puzzle.difficultyRating,
      tags: puzzle.tags,
      averageRating: puzzle.averageRating,
      completionRate,
    };
  }

  private calculateContentSimilarity(
    puzzleFeatures: PuzzleFeatures,
    userPreferences: UserPreference[],
  ): number {
    let totalScore = 0;
    let weightSum = 0;

    // Find matching category preference
    const categoryPreference = userPreferences.find(p => p.category === puzzleFeatures.category);
    if (categoryPreference) {
      const categoryWeight = 0.4;
      totalScore += categoryPreference.preferenceScore * categoryWeight;
      weightSum += categoryWeight;

      // Difficulty matching within category
      const difficultyWeight = 0.3;
      const difficultyMatch = this.calculateDifficultyMatch(
        puzzleFeatures.difficulty,
        categoryPreference.difficulty,
      );
      totalScore += difficultyMatch * difficultyWeight;
      weightSum += difficultyWeight;

      // Tag similarity
      const tagWeight = 0.2;
      const tagSimilarity = this.calculateTagSimilarity(
        puzzleFeatures.tags,
        categoryPreference.tagPreferences,
      );
      totalScore += tagSimilarity * tagWeight;
      weightSum += tagWeight;
    }

    // Quality score (rating and completion rate)
    const qualityWeight = 0.1;
    const qualityScore = (puzzleFeatures.averageRating / 5.0) * 0.7 + puzzleFeatures.completionRate * 0.3;
    totalScore += qualityScore * qualityWeight;
    weightSum += qualityWeight;

    return weightSum > 0 ? totalScore / weightSum : 0;
  }

  private calculateDifficultyMatch(puzzleDifficulty: string, preferredDifficulty: string): number {
    const difficultyOrder = ['easy', 'medium', 'hard', 'expert'];
    const puzzleIndex = difficultyOrder.indexOf(puzzleDifficulty);
    const preferredIndex = difficultyOrder.indexOf(preferredDifficulty);

    if (puzzleIndex === -1 || preferredIndex === -1) return 0.5;

    const distance = Math.abs(puzzleIndex - preferredIndex);
    return Math.max(0, 1 - distance * 0.3); // Penalty for each difficulty level difference
  }

  private calculateTagSimilarity(puzzleTags: string[], userTagPreferences: Record<string, number>): number {
    if (puzzleTags.length === 0 || Object.keys(userTagPreferences).length === 0) {
      return 0.5; // Neutral score when no tags to compare
    }

    let totalSimilarity = 0;
    let matchingTags = 0;

    for (const tag of puzzleTags) {
      if (userTagPreferences[tag] !== undefined) {
        totalSimilarity += userTagPreferences[tag];
        matchingTags++;
      }
    }

    return matchingTags > 0 ? totalSimilarity / matchingTags : 0.3;
  }

  private generateRecommendationReason(
    features: PuzzleFeatures,
    userPreferences: UserPreference[],
    score: number,
  ): string {
    const categoryPreference = userPreferences.find(p => p.category === features.category);
    
    if (!categoryPreference) {
      return `New ${features.category} puzzle to explore`;
    }

    const reasons: string[] = [];

    if (categoryPreference.preferenceScore > 0.7) {
      reasons.push(`You enjoy ${features.category} puzzles`);
    }

    if (features.averageRating > 4.0) {
      reasons.push('highly rated by other players');
    }

    if (features.completionRate > 0.8) {
      reasons.push('has a good completion rate');
    }

    const matchingTags = features.tags.filter(tag => 
      categoryPreference.tagPreferences[tag] > 0.6
    );

    if (matchingTags.length > 0) {
      reasons.push(`matches your interest in ${matchingTags.slice(0, 2).join(', ')}`);
    }

    return reasons.length > 0 
      ? `Recommended because ${reasons.join(' and ')}`
      : `Similar to puzzles you've enjoyed`;
  }
}