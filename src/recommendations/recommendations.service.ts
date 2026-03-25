import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not, In, SelectQueryBuilder } from 'typeorm';
import { CacheService } from '../cache/services/cache.service';
import { UserProgress } from '../user-progress/entities/user-progress.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { RecommendationFeedback } from './entities/recommendation-feedback.entity';
import { PuzzleDifficultyService } from '../difficulty-scaling/puzzle-difficulty.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PuzzleRecommendationDto, TrendingPuzzleDto, SubmitFeedbackDto } from './dto/recommendation.dto';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    @InjectRepository(UserProgress)
    private readonly userProgressRepo: Repository<UserProgress>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepo: Repository<Puzzle>,
    @InjectRepository(UserInteraction)
    private readonly interactionRepo: Repository<UserInteraction>,
    @InjectRepository(RecommendationFeedback)
    private readonly feedbackRepo: Repository<RecommendationFeedback>,
    private readonly cacheService: CacheService,
    private readonly difficultyService: PuzzleDifficultyService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Get personalized puzzle recommendations for a user
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<PuzzleRecommendationDto[]> {
    const cacheKey = `recommendations:personalized:${userId}:${limit}`;

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user progress and preferences
    const userProgress = await this.userProgressRepo.findOne({ where: { userId } });
    if (!userProgress) {
      // Fallback to trending for new users
      return this.getTrendingRecommendations(limit);
    }

    // Get user's solved puzzles
    const solvedPuzzleIds = userProgress.solvedPuzzles || [];

    // Calculate user's average difficulty
    const userDifficulty = await this.calculateUserAverageDifficulty(userId);

    // Get user's preferred categories from interactions
    const preferredCategories = await this.getUserPreferredCategories(userId);

    // Build query for candidate puzzles
    let query = this.puzzleRepo
      .createQueryBuilder('puzzle')
      .leftJoin('puzzle.ratings', 'ratings')
      .leftJoin('puzzle.category', 'category')
      .where('puzzle.isActive = :isActive', { isActive: true })
      .andWhere('puzzle.publishedAt IS NOT NULL')
      .andWhere('puzzle.id NOT IN (:...solvedIds)', { solvedIds: solvedPuzzleIds.length > 0 ? solvedPuzzleIds : ['dummy'] })
      .andWhere('puzzle.createdAt > :thirtyDaysAgo', { thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
      .select([
        'puzzle.id',
        'puzzle.title',
        'puzzle.description',
        'puzzle.category',
        'puzzle.difficulty',
        'puzzle.difficultyRating',
        'puzzle.basePoints',
        'puzzle.timeLimit',
        'puzzle.tags',
        'puzzle.createdAt',
      ])
      .groupBy('puzzle.id');

    // Apply difficulty filter (±1 of user's average)
    if (userDifficulty > 0) {
      query = query.andWhere('puzzle.difficultyRating BETWEEN :minDiff AND :maxDiff', {
        minDiff: Math.max(1, userDifficulty - 1),
        maxDiff: Math.min(10, userDifficulty + 1),
      });
    }

    const candidatePuzzles = await query.getRawAndEntities();

    // Score and rank puzzles
    const scoredPuzzles = await Promise.all(
      candidatePuzzles.entities.map(async (puzzle) => {
        const score = await this.calculateRecommendationScore(puzzle, userProgress, preferredCategories, userDifficulty);
        return {
          ...puzzle,
          score,
          reason: this.generateRecommendationReason(puzzle, score, preferredCategories, userDifficulty),
        };
      })
    );

    // Sort by score and take top results
    const recommendations = scoredPuzzles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(puzzle => ({
        id: puzzle.id,
        title: puzzle.title,
        description: puzzle.description,
        category: puzzle.category,
        difficulty: puzzle.difficulty,
        difficultyRating: puzzle.difficultyRating,
        basePoints: puzzle.basePoints,
        timeLimit: puzzle.timeLimit,
        tags: puzzle.tags || [],
        createdAt: puzzle.createdAt,
        score: puzzle.score,
        reason: puzzle.reason,
      }));

    // Cache the results
    await this.cacheService.set(cacheKey, recommendations, { ttl: this.CACHE_TTL });

    return recommendations;
  }

  /**
   * Get trending puzzles based on recent completions
   */
  async getTrendingRecommendations(limit: number = 10): Promise<TrendingPuzzleDto[]> {
    const cacheKey = `recommendations:trending:${limit}`;

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get puzzles with completion counts in the last 7 days
    const trendingPuzzles = await this.puzzleRepo
      .createQueryBuilder('puzzle')
      .leftJoin('puzzle.ratings', 'ratings')
      .where('puzzle.isActive = :isActive', { isActive: true })
      .andWhere('puzzle.publishedAt IS NOT NULL')
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('COUNT(ui.id)', 'completionCount')
          .from(UserInteraction, 'ui')
          .where('ui.puzzleId = puzzle.id')
          .andWhere('ui.interactionType = :type', { type: 'complete' })
          .andWhere('ui.createdAt > :sevenDaysAgo', { sevenDaysAgo: sevenDaysAgo })
          .getQuery();
        return '0 < (' + subQuery + ')';
      })
      .select([
        'puzzle.id',
        'puzzle.title',
        'puzzle.description',
        'puzzle.category',
        'puzzle.difficulty',
        'puzzle.difficultyRating',
        'puzzle.basePoints',
        'puzzle.timeLimit',
        'puzzle.tags',
        'puzzle.createdAt',
      ])
      .addSelect(subQuery => {
        return subQuery
          .select('COUNT(ui.id)', 'completionsLast7Days')
          .from(UserInteraction, 'ui')
          .where('ui.puzzleId = puzzle.id')
          .andWhere('ui.interactionType = :type', { type: 'complete' })
          .andWhere('ui.createdAt > :sevenDaysAgo', { sevenDaysAgo: sevenDaysAgo });
      }, 'completionsLast7Days')
      .orderBy('completionsLast7Days', 'DESC')
      .setParameter('sevenDaysAgo', sevenDaysAgo)
      .setParameter('type', 'complete')
      .limit(limit)
      .getRawAndEntities();

    const result = trendingPuzzles.raw.map((raw, index) => ({
      id: trendingPuzzles.entities[index].id,
      title: trendingPuzzles.entities[index].title,
      description: trendingPuzzles.entities[index].description,
      category: trendingPuzzles.entities[index].category,
      difficulty: trendingPuzzles.entities[index].difficulty,
      difficultyRating: trendingPuzzles.entities[index].difficultyRating,
      basePoints: trendingPuzzles.entities[index].basePoints,
      timeLimit: trendingPuzzles.entities[index].timeLimit,
      tags: trendingPuzzles.entities[index].tags || [],
      createdAt: trendingPuzzles.entities[index].createdAt,
      completionsLast7Days: parseInt(raw.completionsLast7Days) || 0,
    }));

    // Cache the results
    await this.cacheService.set(cacheKey, result, { ttl: this.CACHE_TTL });

    return result;
  }

  /**
   * Submit feedback on a recommendation
   */
  async submitFeedback(userId: string, feedback: SubmitFeedbackDto): Promise<void> {
    // Clear user's recommendation cache when feedback is submitted
    await this.invalidateUserCache(userId);

    const feedbackEntity = this.feedbackRepo.create({
      userId,
      puzzleId: feedback.puzzleId,
      feedbackType: feedback.feedbackType,
      comment: feedback.comment,
      metadata: feedback.metadata || {},
    });

    await this.feedbackRepo.save(feedbackEntity);

    // Track feedback event for analytics
    await this.analyticsService.trackEvent({
      eventType: 'recommendation_feedback',
      playerId: userId,
      metadata: {
        puzzleId: feedback.puzzleId,
        feedbackType: feedback.feedbackType,
        comment: feedback.comment,
        ...feedback.metadata,
      },
    });
  }

  /**
   * Calculate recommendation score based on multiple factors
   */
  private async calculateRecommendationScore(
    puzzle: Puzzle,
    userProgress: UserProgress,
    preferredCategories: string[],
    userDifficulty: number,
  ): Promise<number> {
    let score = 0;

    // Recency weight (0-0.3): newer puzzles get higher scores
    const daysSinceCreated = (Date.now() - puzzle.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0, 0.3 - (daysSinceCreated / 30) * 0.3);
    score += recencyWeight;

    // Type match weight (0-0.4): preferred categories get higher scores
    const typeMatchWeight = preferredCategories.includes(puzzle.category) ? 0.4 : 0.1;
    score += typeMatchWeight;

    // Difficulty fit weight (0-0.3): closer to user's average difficulty gets higher scores
    const difficultyDiff = Math.abs(puzzle.difficultyRating - userDifficulty);
    const difficultyFitWeight = Math.max(0, 0.3 - difficultyDiff * 0.15);
    score += difficultyFitWeight;

    return Math.min(1.0, score); // Cap at 1.0
  }

  /**
   * Generate human-readable reason for recommendation
   */
  private generateRecommendationReason(
    puzzle: Puzzle,
    score: number,
    preferredCategories: string[],
    userDifficulty: number,
  ): string {
    const reasons = [];

    if (preferredCategories.includes(puzzle.category)) {
      reasons.push(`matches your preferred ${puzzle.category} category`);
    }

    const difficultyDiff = Math.abs(puzzle.difficultyRating - userDifficulty);
    if (difficultyDiff <= 0.5) {
      reasons.push('matches your skill level perfectly');
    } else if (difficultyDiff <= 1) {
      reasons.push('is a good challenge for your skill level');
    }

    const daysSinceCreated = (Date.now() - puzzle.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated <= 7) {
      reasons.push('is newly added');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'recommended for you';
  }

  /**
   * Calculate user's average difficulty based on completed puzzles
   */
  private async calculateUserAverageDifficulty(userId: string): Promise<number> {
    const interactions = await this.interactionRepo.find({
      where: { userId, interactionType: 'complete' },
      relations: ['puzzle'],
    });

    if (interactions.length === 0) return 5; // Default medium difficulty

    const totalDifficulty = interactions.reduce((sum, interaction) => {
      return sum + (interaction.puzzle?.difficultyRating || 5);
    }, 0);

    return totalDifficulty / interactions.length;
  }

  /**
   * Get user's preferred categories based on completion history
   */
  private async getUserPreferredCategories(userId: string): Promise<string[]> {
    const categoryCounts = await this.interactionRepo
      .createQueryBuilder('interaction')
      .leftJoin('interaction.puzzle', 'puzzle')
      .where('interaction.userId = :userId', { userId })
      .andWhere('interaction.interactionType = :type', { type: 'complete' })
      .select('puzzle.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('puzzle.category')
      .orderBy('COUNT(*)', 'DESC')
      .limit(3)
      .getRawMany();

    return categoryCounts.map(row => row.category);
  }

  /**
   * Invalidate user's cached recommendations
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    const pattern = `recommendations:personalized:${userId}:*`;
    // Note: This would need to be implemented in the cache service for pattern deletion
    // For now, we'll let the cache expire naturally
  }
}
