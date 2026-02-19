import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollaborativeFilteringService } from './collaborative-filtering.service';
import { ContentBasedFilteringService } from './content-based-filtering.service';
import { Recommendation } from '../entities/recommendation.entity';
import { UserInteraction } from '../entities/user-interaction.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

interface PuzzleScore {
  puzzleId: string;
  score: number;
  reason: string;
}

interface RecommendationResult {
  puzzleId: string;
  puzzle: Puzzle;
  score: number;
  reason: string;
  algorithm: string;
  metadata: any;
}

@Injectable()
export class RecommendationEngineService {
  private readonly logger = new Logger(RecommendationEngineService.name);

  constructor(
    private collaborativeFilteringService: CollaborativeFilteringService,
    private contentBasedFilteringService: ContentBasedFilteringService,
    @InjectRepository(Recommendation)
    private recommendationRepository: Repository<Recommendation>,
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
    algorithm?: 'collaborative' | 'content-based' | 'hybrid' | 'popular',
    abTestGroup?: string,
  ): Promise<RecommendationResult[]> {
    try {
      let recommendations: RecommendationResult[] = [];

      // Determine which algorithm to use
      const selectedAlgorithm = algorithm || await this.selectAlgorithm(userId, abTestGroup);

      switch (selectedAlgorithm) {
        case 'collaborative':
          recommendations = await this.getCollaborativeRecommendations(userId, limit, category, difficulty);
          break;
        case 'content-based':
          recommendations = await this.getContentBasedRecommendations(userId, limit, category, difficulty);
          break;
        case 'hybrid':
          recommendations = await this.getHybridRecommendations(userId, limit, category, difficulty);
          break;
        case 'popular':
          recommendations = await this.getPopularRecommendations(userId, limit, category, difficulty);
          break;
        default:
          recommendations = await this.getHybridRecommendations(userId, limit, category, difficulty);
      }

      // Store recommendations for tracking
      await this.storeRecommendations(userId, recommendations, abTestGroup);

      return recommendations;
    } catch (error) {
      this.logger.error(`Error generating recommendations for user ${userId}:`, error);
      // Fallback to popular puzzles
      return this.getPopularRecommendations(userId, limit, category, difficulty);
    }
  }

  private async selectAlgorithm(userId: string, abTestGroup?: string): Promise<string> {
    if (abTestGroup) {
      // A/B testing logic
      switch (abTestGroup) {
        case 'collaborative_only':
          return 'collaborative';
        case 'content_only':
          return 'content-based';
        case 'popular_baseline':
          return 'popular';
        default:
          return 'hybrid';
      }
    }

    // Check user's interaction history to determine best algorithm
    const interactionCount = await this.userInteractionRepository.count({
      where: { userId, interactionType: 'complete' },
    });

    if (interactionCount < 3) {
      return 'popular'; // New users get popular puzzles
    } else if (interactionCount < 10) {
      return 'content-based'; // Users with some history get content-based
    } else {
      return 'hybrid'; // Experienced users get hybrid recommendations
    }
  }

  private async getCollaborativeRecommendations(
    userId: string,
    limit: number,
    category?: string,
    difficulty?: string,
  ): Promise<RecommendationResult[]> {
    const scores = await this.collaborativeFilteringService.generateRecommendations(
      userId,
      limit,
      category,
      difficulty,
    );

    return this.enrichRecommendations(scores, 'collaborative');
  }

  private async getContentBasedRecommendations(
    userId: string,
    limit: number,
    category?: string,
    difficulty?: string,
  ): Promise<RecommendationResult[]> {
    const scores = await this.contentBasedFilteringService.generateRecommendations(
      userId,
      limit,
      category,
      difficulty,
    );

    return this.enrichRecommendations(scores, 'content-based');
  }

  private async getHybridRecommendations(
    userId: string,
    limit: number,
    category?: string,
    difficulty?: string,
  ): Promise<RecommendationResult[]> {
    // Get recommendations from both algorithms
    const collaborativePromise = this.collaborativeFilteringService.generateRecommendations(
      userId,
      Math.ceil(limit * 0.6),
      category,
      difficulty,
    );

    const contentBasedPromise = this.contentBasedFilteringService.generateRecommendations(
      userId,
      Math.ceil(limit * 0.6),
      category,
      difficulty,
    );

    const [collaborativeScores, contentBasedScores] = await Promise.all([
      collaborativePromise,
      contentBasedPromise,
    ]);

    // Combine and weight the scores
    const combinedScores = this.combineRecommendations(
      collaborativeScores,
      contentBasedScores,
      0.6, // Weight for collaborative filtering
      0.4, // Weight for content-based filtering
    );

    return this.enrichRecommendations(combinedScores.slice(0, limit), 'hybrid');
  }

  private async getPopularRecommendations(
    userId: string,
    limit: number,
    category?: string,
    difficulty?: string,
  ): Promise<RecommendationResult[]> {
    // Get user's completed puzzles to avoid recommending them
    const completedPuzzles = await this.userInteractionRepository.find({
      where: { userId, interactionType: 'complete' },
      select: ['puzzleId'],
    });

    const completedPuzzleIds = completedPuzzles.map(p => p.puzzleId);

    let query = this.puzzleRepository
      .createQueryBuilder('puzzle')
      .where('puzzle.isActive = :active', { active: true })
      .andWhere('puzzle.publishedAt IS NOT NULL');

    if (completedPuzzleIds.length > 0) {
      query = query.andWhere('puzzle.id NOT IN (:...excludeIds)', { 
        excludeIds: completedPuzzleIds 
      });
    }

    if (category) {
      query = query.andWhere('puzzle.category = :category', { category });
    }

    if (difficulty) {
      query = query.andWhere('puzzle.difficulty = :difficulty', { difficulty });
    }

    const popularPuzzles = await query
      .orderBy('puzzle.completions', 'DESC')
      .addOrderBy('puzzle.averageRating', 'DESC')
      .limit(limit)
      .getMany();

    const scores: PuzzleScore[] = popularPuzzles.map((puzzle, index) => ({
      puzzleId: puzzle.id,
      score: Math.max(0.9 - (index * 0.05), 0.3), // Decreasing score based on popularity rank
      reason: `Popular puzzle with ${puzzle.completions} completions and ${puzzle.averageRating.toFixed(1)} rating`,
    }));

    return this.enrichRecommendations(scores, 'popular');
  }

  private combineRecommendations(
    collaborativeScores: PuzzleScore[],
    contentBasedScores: PuzzleScore[],
    collaborativeWeight: number,
    contentBasedWeight: number,
  ): PuzzleScore[] {
    const combinedMap = new Map<string, PuzzleScore>();

    // Add collaborative filtering scores
    for (const score of collaborativeScores) {
      combinedMap.set(score.puzzleId, {
        puzzleId: score.puzzleId,
        score: score.score * collaborativeWeight,
        reason: `Collaborative: ${score.reason}`,
      });
    }

    // Add or combine content-based scores
    for (const score of contentBasedScores) {
      const existing = combinedMap.get(score.puzzleId);
      if (existing) {
        // Combine scores
        existing.score += score.score * contentBasedWeight;
        existing.reason += ` | Content-based: ${score.reason}`;
      } else {
        combinedMap.set(score.puzzleId, {
          puzzleId: score.puzzleId,
          score: score.score * contentBasedWeight,
          reason: `Content-based: ${score.reason}`,
        });
      }
    }

    return Array.from(combinedMap.values())
      .sort((a, b) => b.score - a.score);
  }

  private async enrichRecommendations(
    scores: PuzzleScore[],
    algorithm: string,
  ): Promise<RecommendationResult[]> {
    const puzzleIds = scores.map(s => s.puzzleId);
    
    if (puzzleIds.length === 0) {
      return [];
    }

    const puzzles = await this.puzzleRepository.findByIds(puzzleIds);
    const puzzleMap = new Map(puzzles.map(p => [p.id, p]));

    const results: RecommendationResult[] = [];

    for (const score of scores) {
      const puzzle = puzzleMap.get(score.puzzleId);
      if (puzzle) {
        results.push({
          puzzleId: score.puzzleId,
          puzzle,
          score: score.score,
          reason: score.reason,
          algorithm,
          metadata: {
            category: puzzle.category,
            difficulty: puzzle.difficulty,
            averageRating: puzzle.averageRating,
            completions: puzzle.completions,
          },
        });
      }
    }

    return results;
  }

  private async storeRecommendations(
    userId: string,
    recommendations: RecommendationResult[],
    abTestGroup?: string,
  ): Promise<void> {
    const recommendationEntities = recommendations.map(rec => 
      this.recommendationRepository.create({
        userId,
        puzzleId: rec.puzzleId,
        algorithm: rec.algorithm as any,
        score: rec.score,
        reason: rec.reason,
        metadata: {
          ...rec.metadata,
          abTestGroup,
        },
      } as any)
    );

    await this.recommendationRepository.save(recommendationEntities as any);
  }

  async trackInteraction(
    userId: string,
    puzzleId: string,
    interactionType: string,
    value?: number,
    metadata?: any,
  ): Promise<void> {
    // Store the interaction
    const interaction = this.userInteractionRepository.create({
      userId,
      puzzleId,
      interactionType: interactionType as any,
      value,
      metadata,
    } as any);

    await this.userInteractionRepository.save(interaction);

    // Update recommendation tracking
    if (interactionType === 'view') {
      await this.updateRecommendationTracking(userId, puzzleId, 'wasViewed', 'viewedAt');
    } else if (interactionType === 'click') {
      await this.updateRecommendationTracking(userId, puzzleId, 'wasClicked', 'clickedAt');
    } else if (interactionType === 'complete') {
      await this.updateRecommendationTracking(userId, puzzleId, 'wasCompleted', 'completedAt');
    }
  }

  private async updateRecommendationTracking(
    userId: string,
    puzzleId: string,
    field: string,
    timestampField: string,
  ): Promise<void> {
    await this.recommendationRepository
      .createQueryBuilder()
      .update(Recommendation)
      .set({
        [field]: true,
        [timestampField]: new Date(),
      })
      .where('userId = :userId', { userId })
      .andWhere('puzzleId = :puzzleId', { puzzleId })
      .execute();
  }

  async getRecommendationMetrics(
    userId?: string,
    algorithm?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    let query = this.recommendationRepository
      .createQueryBuilder('rec')
      .select([
        'rec.algorithm',
        'COUNT(*) as total_recommendations',
        'SUM(CASE WHEN rec.wasViewed THEN 1 ELSE 0 END) as views',
        'SUM(CASE WHEN rec.wasClicked THEN 1 ELSE 0 END) as clicks',
        'SUM(CASE WHEN rec.wasCompleted THEN 1 ELSE 0 END) as completions',
        'AVG(rec.score) as avg_score',
      ]);

    if (userId) {
      query = query.where('rec.userId = :userId', { userId });
    }

    if (algorithm) {
      query = query.andWhere('rec.algorithm = :algorithm', { algorithm });
    }

    if (startDate) {
      query = query.andWhere('rec.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query = query.andWhere('rec.createdAt <= :endDate', { endDate });
    }

    const results = await query
      .groupBy('rec.algorithm')
      .getRawMany();

    return results.map(result => ({
      algorithm: result.algorithm,
      totalRecommendations: parseInt(result.total_recommendations),
      views: parseInt(result.views),
      clicks: parseInt(result.clicks),
      completions: parseInt(result.completions),
      clickThroughRate: result.views > 0 ? (result.clicks / result.views) : 0,
      completionRate: result.clicks > 0 ? (result.completions / result.clicks) : 0,
      averageScore: parseFloat(result.avg_score) || 0,
    }));
  }
}