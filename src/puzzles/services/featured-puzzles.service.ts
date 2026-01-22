import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserPuzzleSubmission, PuzzleSubmissionStatus } from '../entities/user-puzzle-submission.entity';

export interface FeaturedPuzzleCriteria {
  minRating: number;
  minPlays: number;
  minAge: number; // days since publication
  maxAge: number; // days since publication
  categories?: string[];
  excludeCreators?: string[];
  maxFromSameCreator: number;
  diversityWeight: number; // 0-1, how much to prioritize diversity
}

export interface RotationSchedule {
  daily: number;
  weekly: number;
  monthly: number;
}

@Injectable()
export class FeaturedPuzzlesService {
  private readonly logger = new Logger(FeaturedPuzzlesService.name);

  constructor(
    @InjectRepository(UserPuzzleSubmission)
    private readonly submissionRepository: Repository<UserPuzzleSubmission>,
  ) {}

  // Automatic featured puzzle rotation (runs daily at midnight)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async rotateFeaturedPuzzles(): Promise<void> {
    this.logger.log('Starting daily featured puzzle rotation');
    
    try {
      // Unfeature puzzles that have been featured for too long
      await this.unfeatureExpiredPuzzles();
      
      // Select new featured puzzles
      await this.selectNewFeaturedPuzzles();
      
      this.logger.log('Completed daily featured puzzle rotation');
    } catch (error) {
      this.logger.error('Error during featured puzzle rotation:', error);
    }
  }

  // Weekly featured puzzle selection (runs every Sunday at 2 AM)
  @Cron('0 2 * * 0') // Every Sunday at 2 AM
  async weeklyFeatureSelection(): Promise<void> {
    this.logger.log('Starting weekly featured puzzle selection');
    
    try {
      await this.selectWeeklyFeaturedPuzzles();
      this.logger.log('Completed weekly featured puzzle selection');
    } catch (error) {
      this.logger.error('Error during weekly featured selection:', error);
    }
  }

  async getFeaturedPuzzles(limit: number = 10): Promise<UserPuzzleSubmission[]> {
    return await this.submissionRepository.find({
      where: {
        status: PuzzleSubmissionStatus.FEATURED,
        isPublic: true,
      },
      order: { featuredAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async getFeaturedPuzzlesByCategory(category: string, limit: number = 5): Promise<UserPuzzleSubmission[]> {
    return await this.submissionRepository.find({
      where: {
        status: PuzzleSubmissionStatus.FEATURED,
        isPublic: true,
        category,
      },
      order: { featuredAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async manuallyFeaturePuzzle(submissionId: string, adminId: string): Promise<UserPuzzleSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    if (submission.status !== PuzzleSubmissionStatus.PUBLISHED) {
      throw new Error('Only published puzzles can be featured');
    }

    submission.status = PuzzleSubmissionStatus.FEATURED;
    submission.featuredAt = new Date();
    submission.moderationData = {
      ...submission.moderationData,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      reviewNotes: 'Manually featured by admin',
    };

    await this.submissionRepository.save(submission);

    // Update creator rewards
    await this.updateCreatorRewards(submission.userId, 'featured');

    this.logger.log(`Puzzle ${submissionId} manually featured by admin ${adminId}`);
    return submission;
  }

  async unfeaturePuzzle(submissionId: string, adminId: string): Promise<UserPuzzleSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    if (submission.status !== PuzzleSubmissionStatus.FEATURED) {
      throw new Error('Puzzle is not currently featured');
    }

    submission.status = PuzzleSubmissionStatus.PUBLISHED;
    submission.featuredAt = null;

    await this.submissionRepository.save(submission);

    this.logger.log(`Puzzle ${submissionId} unfeatured by admin ${adminId}`);
    return submission;
  }

  private async unfeatureExpiredPuzzles(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredFeatured = await this.submissionRepository.find({
      where: {
        status: PuzzleSubmissionStatus.FEATURED,
        featuredAt: LessThan(thirtyDaysAgo),
      },
    });

    for (const puzzle of expiredFeatured) {
      puzzle.status = PuzzleSubmissionStatus.PUBLISHED;
      puzzle.featuredAt = null;
      await this.submissionRepository.save(puzzle);
    }

    this.logger.log(`Unfeatured ${expiredFeatured.length} expired puzzles`);
  }

  private async selectNewFeaturedPuzzles(): Promise<void> {
    const criteria: FeaturedPuzzleCriteria = {
      minRating: 4.0,
      minPlays: 50,
      minAge: 7,
      maxAge: 90,
      maxFromSameCreator: 2,
      diversityWeight: 0.3,
    };

    const candidates = await this.findFeaturedCandidates(criteria);
    const selected = await this.selectDiversePuzzles(candidates, criteria, 5);

    for (const puzzle of selected) {
      puzzle.status = PuzzleSubmissionStatus.FEATURED;
      puzzle.featuredAt = new Date();
      await this.submissionRepository.save(puzzle);
    }

    this.logger.log(`Selected ${selected.length} new featured puzzles`);
  }

  private async selectWeeklyFeaturedPuzzles(): Promise<void> {
    // Select top-performing puzzles from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const topPerformers = await this.submissionRepository
      .createQueryBuilder('puzzle')
      .where('puzzle.status = :status', { status: PuzzleSubmissionStatus.PUBLISHED })
      .andWhere('puzzle.isPublic = :isPublic', { isPublic: true })
      .andWhere('puzzle.publishedAt >= :oneWeekAgo', { oneWeekAgo })
      .andWhere('puzzle.averageRating >= :minRating', { minRating: 4.5 })
      .andWhere('puzzle.playCount >= :minPlays', { minPlays: 100 })
      .orderBy('puzzle.communityScore', 'DESC')
      .addOrderBy('puzzle.averageRating', 'DESC')
      .addOrderBy('puzzle.playCount', 'DESC')
      .take(3)
      .getMany();

    for (const puzzle of topPerformers) {
      if (puzzle.status !== PuzzleSubmissionStatus.FEATURED) {
        puzzle.status = PuzzleSubmissionStatus.FEATURED;
        puzzle.featuredAt = new Date();
        await this.submissionRepository.save(puzzle);
      }
    }

    this.logger.log(`Featured ${topPerformers.length} top weekly performers`);
  }

  private async findFeaturedCandidates(criteria: FeaturedPuzzleCriteria): Promise<UserPuzzleSubmission[]> {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - criteria.maxAge);

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - criteria.minAge);

    let query = this.submissionRepository
      .createQueryBuilder('puzzle')
      .where('puzzle.status = :status', { status: PuzzleSubmissionStatus.PUBLISHED })
      .andWhere('puzzle.isPublic = :isPublic', { isPublic: true })
      .andWhere('puzzle.averageRating >= :minRating', { minRating: criteria.minRating })
      .andWhere('puzzle.playCount >= :minPlays', { minPlays: criteria.minPlays })
      .andWhere('puzzle.publishedAt BETWEEN :minDate AND :maxDate', { minDate, maxDate });

    if (criteria.categories && criteria.categories.length > 0) {
      query = query.andWhere('puzzle.category IN (:...categories)', { categories: criteria.categories });
    }

    if (criteria.excludeCreators && criteria.excludeCreators.length > 0) {
      query = query.andWhere('puzzle.userId NOT IN (:...excludeCreators)', { excludeCreators: criteria.excludeCreators });
    }

    return await query
      .orderBy('puzzle.communityScore', 'DESC')
      .addOrderBy('puzzle.averageRating', 'DESC')
      .addOrderBy('puzzle.playCount', 'DESC')
      .getMany();
  }

  private async selectDiversePuzzles(
    candidates: UserPuzzleSubmission[],
    criteria: FeaturedPuzzleCriteria,
    maxSelections: number,
  ): Promise<UserPuzzleSubmission[]> {
    const selected: UserPuzzleSubmission[] = [];
    const creatorCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    // Sort candidates by score
    const sortedCandidates = candidates.sort((a, b) => {
      const scoreA = this.calculateFeaturedScore(a, criteria);
      const scoreB = this.calculateFeaturedScore(b, criteria);
      return scoreB - scoreA;
    });

    for (const candidate of sortedCandidates) {
      if (selected.length >= maxSelections) break;

      // Check creator diversity
      const creatorCount = creatorCounts[candidate.userId] || 0;
      if (creatorCount >= criteria.maxFromSameCreator) continue;

      // Check category diversity (if diversity weight is high)
      if (criteria.diversityWeight > 0.5) {
        const categoryCount = categoryCounts[candidate.category] || 0;
        const maxCategoryCount = Math.ceil(maxSelections / 5); // Max 20% from same category
        if (categoryCount >= maxCategoryCount) continue;
      }

      selected.push(candidate);
      creatorCounts[candidate.userId] = creatorCount + 1;
      categoryCounts[candidate.category] = (categoryCounts[candidate.category] || 0) + 1;
    }

    return selected;
  }

  private calculateFeaturedScore(puzzle: UserPuzzleSubmission, criteria: FeaturedPuzzleCriteria): number {
    let score = 0;

    // Base score from community metrics
    score += puzzle.averageRating * 25; // 25% weight
    score += Math.min(puzzle.playCount / 100, 10) * 15; // 15% weight (capped at 1000 plays)
    score += puzzle.communityScore * 20; // 20% weight

    // Recency bonus (newer puzzles get slight bonus)
    const daysSincePublication = Math.floor((Date.now() - puzzle.publishedAt.getTime()) / (1000 * 60 * 60 * 24));
    const recencyBonus = Math.max(0, 10 - (daysSincePublication / 10)); // Decay over time
    score += recencyBonus * 10; // 10% weight

    // Quality indicators
    if (puzzle.ratingCount >= 10) score += 5; // Minimum ratings threshold
    if (puzzle.ratingCount >= 50) score += 5; // Good number of ratings
    if (puzzle.averageCompletionRate && puzzle.averageCompletionRate > 0.7) score += 5; // Good completion rate

    // Diversity bonus (for underrepresented categories)
    const categoryBonus = this.getCategoryDiversityBonus(puzzle.category);
    score += categoryBonus * criteria.diversityWeight * 10; // 10% weight, scaled by diversity preference

    return score;
  }

  private getCategoryDiversityBonus(category: string): number {
    // In a real implementation, this would check current representation
    // For now, give bonus to less common categories
    const commonCategories = ['logic', 'math', 'pattern'];
    return commonCategories.includes(category) ? 0 : 5;
  }

  private async updateCreatorRewards(userId: string, rewardType: string): Promise<void> {
    // In a real implementation, this would update the creator's reward data
    this.logger.log(`Updating rewards for user ${userId}: ${rewardType}`);
  }

  async getFeaturedPuzzleStats(): Promise<{
    totalFeatured: number;
    currentlyFeatured: number;
    featuredByCategory: Record<string, number>;
    averageFeaturedRating: number;
    featuredAgeDistribution: Record<string, number>;
  }> {
    const totalFeatured = await this.submissionRepository.count({
      where: { status: PuzzleSubmissionStatus.FEATURED },
    });

    const currentlyFeatured = await this.submissionRepository.count({
      where: { 
        status: PuzzleSubmissionStatus.FEATURED,
        isPublic: true,
      },
    });

    const featuredByCategory = await this.submissionRepository
      .createQueryBuilder('puzzle')
      .select('puzzle.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('puzzle.status = :status', { status: PuzzleSubmissionStatus.FEATURED })
      .groupBy('puzzle.category')
      .getRawMany();

    const categoryStats: Record<string, number> = {};
    featuredByCategory.forEach((row: any) => {
      categoryStats[row.category] = parseInt(row.count);
    });

    const averageRatingResult = await this.submissionRepository
      .createQueryBuilder('puzzle')
      .select('AVG(puzzle.averageRating)', 'avgRating')
      .where('puzzle.status = :status', { status: PuzzleSubmissionStatus.FEATURED })
      .getRawOne();

    const averageFeaturedRating = parseFloat(averageRatingResult.avgRating) || 0;

    // Age distribution (how long puzzles have been featured)
    const ageDistribution = await this.getFeaturedAgeDistribution();

    return {
      totalFeatured,
      currentlyFeatured,
      featuredByCategory: categoryStats,
      averageFeaturedRating,
      featuredAgeDistribution: ageDistribution,
    };
  }

  private async getFeaturedAgeDistribution(): Promise<Record<string, number>> {
    const now = new Date();
    const distributions: Record<string, number> = {
      '0-7 days': 0,
      '8-14 days': 0,
      '15-30 days': 0,
      '30+ days': 0,
    };

    const featuredPuzzles = await this.submissionRepository.find({
      where: { status: PuzzleSubmissionStatus.FEATURED },
      select: ['featuredAt'],
    });

    featuredPuzzles.forEach(puzzle => {
      if (!puzzle.featuredAt) return;

      const daysFeatured = Math.floor((now.getTime() - puzzle.featuredAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysFeatured <= 7) distributions['0-7 days']++;
      else if (daysFeatured <= 14) distributions['8-14 days']++;
      else if (daysFeatured <= 30) distributions['15-30 days']++;
      else distributions['30+ days']++;
    });

    return distributions;
  }

  async getFeaturedSchedule(): Promise<RotationSchedule> {
    // This could be configurable in the database
    return {
      daily: 5,
      weekly: 3,
      monthly: 10,
    };
  }

  async updateFeaturedSchedule(schedule: RotationSchedule): Promise<void> {
    // In a real implementation, this would update the schedule in the database
    this.logger.log('Updated featured puzzle rotation schedule:', schedule);
  }
}
