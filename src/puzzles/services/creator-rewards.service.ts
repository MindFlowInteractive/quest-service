import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserPuzzleSubmission, PuzzleSubmissionStatus } from '../entities/user-puzzle-submission.entity';

export interface CreatorLevel {
  level: number;
  title: string;
  minPoints: number;
  benefits: string[];
  badge: string;
}

export interface RewardEvent {
  type: 'puzzle_play' | 'puzzle_rating' | 'puzzle_featured' | 'puzzle_shared' | 'milestone_reached';
  userId: string;
  submissionId?: string;
  points: number;
  metadata?: any;
}

export interface CreatorStats {
  userId: string;
  totalPoints: number;
  currentLevel: number;
  totalPuzzles: number;
  publishedPuzzles: number;
  featuredPuzzles: number;
  totalPlays: number;
  averageRating: number;
  monthlyEarnings: Record<string, number>;
  achievements: string[];
  nextLevelPoints: number;
  pointsToNextLevel: number;
}

@Injectable()
export class CreatorRewardsService {
  private readonly logger = new Logger(CreatorRewardsService.name);

  private readonly creatorLevels: CreatorLevel[] = [
    {
      level: 1,
      title: 'Novice Creator',
      minPoints: 0,
      benefits: ['Basic creator tools', 'Community support'],
      badge: 'bronze',
    },
    {
      level: 2,
      title: 'Apprentice Creator',
      minPoints: 100,
      benefits: ['Advanced analytics', 'Priority support'],
      badge: 'bronze',
    },
    {
      level: 3,
      title: 'Journeyman Creator',
      minPoints: 500,
      benefits: ['Custom themes', 'Enhanced visibility'],
      badge: 'silver',
    },
    {
      level: 4,
      title: 'Expert Creator',
      minPoints: 1500,
      benefits: ['Monetization tools', 'Creator marketplace'],
      badge: 'silver',
    },
    {
      level: 5,
      title: 'Master Creator',
      minPoints: 5000,
      benefits: ['Premium features', 'Revenue sharing'],
      badge: 'gold',
    },
    {
      level: 6,
      title: 'Legendary Creator',
      minPoints: 15000,
      benefits: ['Exclusive content', 'Partner program'],
      badge: 'platinum',
    },
  ];

  constructor(
    @InjectRepository(UserPuzzleSubmission)
    private readonly submissionRepository: Repository<UserPuzzleSubmission>,
  ) {}

  async processRewardEvent(event: RewardEvent): Promise<void> {
    const creatorStats = await this.getCreatorStats(event.userId);
    
    // Update points
    await this.addPointsToCreator(event.userId, event.points);
    
    // Check for level up
    await this.checkLevelUp(event.userId, creatorStats);
    
    // Check for achievements
    await this.checkAchievements(event.userId, event);
    
    // Update monthly earnings
    await this.updateMonthlyEarnings(event.userId, event.points);
    
    this.logger.log(`Processed reward event for user ${event.userId}: +${event.points} points`);
  }

  async onPuzzlePlayed(submissionId: string, userId: string): Promise<void> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission || !submission.userId) return;

    // Don't reward creators for their own puzzle plays
    if (submission.userId === userId) return;

    const points = this.calculatePlayPoints(submission);
    
    await this.processRewardEvent({
      type: 'puzzle_play',
      userId: submission.userId,
      submissionId,
      points,
      metadata: {
        playedBy: userId,
        puzzleRating: submission.averageRating,
      },
    });
  }

  async onPuzzleRated(submissionId: string, rating: number, userId: string): Promise<void> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission || !submission.userId) return;

    // Don't reward creators for their own puzzle ratings
    if (submission.userId === userId) return;

    const points = this.calculateRatingPoints(rating);
    
    await this.processRewardEvent({
      type: 'puzzle_rating',
      userId: submission.userId,
      submissionId,
      points,
      metadata: {
        rating,
        ratedBy: userId,
      },
    });
  }

  async onPuzzleFeatured(submissionId: string, featuredBy: string): Promise<void> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission || !submission.userId) return;

    const points = this.calculateFeaturedPoints(submission);
    
    await this.processRewardEvent({
      type: 'puzzle_featured',
      userId: submission.userId,
      submissionId,
      points,
      metadata: {
        featuredBy,
        featuredAt: new Date(),
      },
    });

    // Update submission reward data
    const currentFeaturedCount = submission.rewardData?.featuredCount || 0;
    submission.rewardData = {
      ...submission.rewardData,
      featuredCount: currentFeaturedCount + 1,
    };
    await this.submissionRepository.save(submission);
  }

  async onPuzzleShared(submissionId: string, platform: string, userId: string): Promise<void> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission || !submission.userId) return;

    const points = this.calculateSharePoints(platform);
    
    await this.processRewardEvent({
      type: 'puzzle_shared',
      userId: submission.userId,
      submissionId,
      points,
      metadata: {
        platform,
        sharedBy: userId,
      },
    });
  }

  async getCreatorStats(userId: string): Promise<CreatorStats> {
    const submissions = await this.submissionRepository.find({
      where: { userId },
    });

    const publishedPuzzles = submissions.filter(s => s.status === PuzzleSubmissionStatus.PUBLISHED);
    const featuredPuzzles = submissions.filter(s => s.status === PuzzleSubmissionStatus.FEATURED);
    
    const totalPlays = publishedPuzzles.reduce((sum, s) => sum + s.playCount, 0);
    const averageRating = publishedPuzzles.length > 0
      ? publishedPuzzles.reduce((sum, s) => sum + s.averageRating, 0) / publishedPuzzles.length
      : 0;

    // Get total points from reward data
    const totalPoints = await this.getTotalPoints(userId);
    const currentLevel = this.getCreatorLevel(totalPoints);
    const nextLevel = this.creatorLevels[currentLevel.level + 1] || this.creatorLevels[currentLevel.level];

    return {
      userId,
      totalPoints,
      currentLevel: currentLevel.level,
      totalPuzzles: submissions.length,
      publishedPuzzles: publishedPuzzles.length,
      featuredPuzzles: featuredPuzzles.length,
      totalPlays,
      averageRating,
      monthlyEarnings: await this.getMonthlyEarnings(userId),
      achievements: await this.getCreatorAchievements(userId),
      nextLevelPoints: nextLevel.minPoints,
      pointsToNextLevel: Math.max(0, nextLevel.minPoints - totalPoints),
    };
  }

  async getLeaderboard(limit: number = 50, timeframe: 'all' | 'month' | 'week' = 'all'): Promise<Array<{
    userId: string;
    username: string;
    points: number;
    level: number;
    title: string;
    badge: string;
    rank: number;
  }>> {
    let dateFilter: any = {};
    
    if (timeframe === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { createdAt: Between(oneWeekAgo, new Date()) };
    } else if (timeframe === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateFilter = { createdAt: Between(oneMonthAgo, new Date()) };
    }

    // In a real implementation, this would query a rewards/points table
    // For now, we'll use puzzle stats as a proxy
    const query = this.submissionRepository
      .createQueryBuilder('submission')
      .select([
        'submission.userId',
        'COUNT(submission.id) as puzzleCount',
        'SUM(submission.playCount) as totalPlays',
        'AVG(submission.averageRating) as avgRating',
      ])
      .where('submission.status = :status', { status: PuzzleSubmissionStatus.PUBLISHED })
      .groupBy('submission.userId')
      .orderBy('totalPlays', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    return results.map((result: any, index: number) => {
      const points = this.calculatePointsFromStats(result);
      const level = this.getCreatorLevel(points);
      
      return {
        userId: result.submission_userId,
        username: `creator_${result.submission_userId}`, // Would join with users table
        points,
        level: level.level,
        title: level.title,
        badge: level.badge,
        rank: index + 1,
      };
    });
  }

  async getTopCreators(limit: number = 10): Promise<Array<{
    userId: string;
    username: string;
    totalPuzzles: number;
    featuredPuzzles: number;
    totalPlays: number;
    averageRating: number;
    level: number;
    badge: string;
  }>> {
    const query = this.submissionRepository
      .createQueryBuilder('submission')
      .select([
        'submission.userId',
        'COUNT(CASE WHEN submission.status = :published THEN 1 END) as publishedCount',
        'COUNT(CASE WHEN submission.status = :featured THEN 1 END) as featuredCount',
        'SUM(submission.playCount) as totalPlays',
        'AVG(submission.averageRating) as avgRating',
      ])
      .setParameter('published', PuzzleSubmissionStatus.PUBLISHED)
      .setParameter('featured', PuzzleSubmissionStatus.FEATURED)
      .where('submission.status IN (:...statuses)', { 
        statuses: [PuzzleSubmissionStatus.PUBLISHED, PuzzleSubmissionStatus.FEATURED] 
      })
      .groupBy('submission.userId')
      .having('publishedCount > 0')
      .orderBy('totalPlays', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    return results.map((result: any) => {
      const points = this.calculatePointsFromStats(result);
      const level = this.getCreatorLevel(points);
      
      return {
        userId: result.submission_userId,
        username: `creator_${result.submission_userId}`,
        totalPuzzles: parseInt(result.publishedCount) || 0,
        featuredPuzzles: parseInt(result.featuredCount) || 0,
        totalPlays: parseInt(result.totalPlays) || 0,
        averageRating: parseFloat(result.avgRating) || 0,
        level: level.level,
        badge: level.badge,
      };
    });
  }

  // Monthly reward processing (runs on the 1st of each month)
  @Cron('0 0 1 * *') // 1st of every month at midnight
  async processMonthlyRewards(): Promise<void> {
    this.logger.log('Processing monthly creator rewards');
    
    try {
      // Get top creators for the month
      const topCreators = await this.getLeaderboard(100, 'month');
      
      // Award monthly bonuses
      for (let i = 0; i < topCreators.length; i++) {
        const creator = topCreators[i];
        const bonusPoints = this.calculateMonthlyBonus(i + 1, creator.points);
        
        await this.processRewardEvent({
          type: 'milestone_reached',
          userId: creator.userId,
          points: bonusPoints,
          metadata: {
            milestone: 'monthly_top_creator',
            rank: i + 1,
            timeframe: 'month',
          },
        });
      }
      
      this.logger.log(`Processed monthly rewards for ${topCreators.length} creators`);
    } catch (error) {
      this.logger.error('Error processing monthly rewards:', error);
    }
  }

  private calculatePlayPoints(submission: UserPuzzleSubmission): number {
    let points = 1; // Base point for each play
    
    // Bonus points for highly-rated puzzles
    if (submission.averageRating >= 4.5) points += 2;
    else if (submission.averageRating >= 4.0) points += 1;
    
    // Bonus points for featured puzzles
    if (submission.status === PuzzleSubmissionStatus.FEATURED) points += 3;
    
    // Bonus points for difficult puzzles (encourages quality content)
    if (submission.difficulty === 'expert') points += 2;
    else if (submission.difficulty === 'hard') points += 1;
    
    return Math.min(points, 10); // Cap at 10 points per play
  }

  private calculateRatingPoints(rating: number): number {
    // Higher ratings give more points to creators
    if (rating === 5) return 10;
    if (rating === 4) return 5;
    if (rating === 3) return 2;
    return 0; // Low ratings don't give points
  }

  private calculateFeaturedPoints(submission: UserPuzzleSubmission): number {
    // Featured puzzles give significant points based on quality
    let points = 50; // Base points for being featured
    
    // Bonus for high ratings
    if (submission.averageRating >= 4.5) points += 25;
    else if (submission.averageRating >= 4.0) points += 15;
    
    // Bonus for high play count
    if (submission.playCount >= 1000) points += 25;
    else if (submission.playCount >= 500) points += 15;
    else if (submission.playCount >= 100) points += 5;
    
    return points;
  }

  private calculateSharePoints(platform: string): number {
    // Different platforms have different values
    const platformPoints: Record<string, number> = {
      twitter: 3,
      facebook: 2,
      reddit: 5,
      discord: 4,
      whatsapp: 1,
      link: 1,
      embed: 2,
    };
    
    return platformPoints[platform] || 1;
  }

  private calculateMonthlyBonus(rank: number, points: number): number {
    // Top creators get significant monthly bonuses
    if (rank === 1) return 1000;
    if (rank === 2) return 500;
    if (rank === 3) return 250;
    if (rank <= 10) return 100;
    if (rank <= 25) return 50;
    if (rank <= 50) return 25;
    if (rank <= 100) return 10;
    return 0;
  }

  private calculatePointsFromStats(stats: any): number {
    // Approximate points calculation from puzzle statistics
    let points = 0;
    
    // Points from plays (1 point per 10 plays)
    points += Math.floor((stats.totalPlays || 0) / 10);
    
    // Points from ratings (5 points per 5-star rating)
    points += (stats.avgRating || 0) * (stats.puzzleCount || 0) * 5;
    
    // Points from featured puzzles (50 points each)
    points += (stats.featuredCount || 0) * 50;
    
    // Base points for having published puzzles
    points += (stats.publishedCount || 0) * 10;
    
    return points;
  }

  private getCreatorLevel(points: number): CreatorLevel {
    for (let i = this.creatorLevels.length - 1; i >= 0; i--) {
      if (points >= this.creatorLevels[i].minPoints) {
        return this.creatorLevels[i];
      }
    }
    return this.creatorLevels[0];
  }

  private async addPointsToCreator(userId: string, points: number): Promise<void> {
    // In a real implementation, this would update a points/rewards table
    this.logger.log(`Added ${points} points to creator ${userId}`);
  }

  private async getTotalPoints(userId: string): Promise<number> {
    // In a real implementation, this would query the points table
    // For now, calculate from puzzle stats
    const submissions = await this.submissionRepository.find({
      where: { userId },
    });
    
    return this.calculatePointsFromStats({
      totalPlays: submissions.reduce((sum, s) => sum + s.playCount, 0),
      avgRating: submissions.reduce((sum, s) => sum + s.averageRating, 0) / submissions.length || 0,
      puzzleCount: submissions.filter(s => s.status === PuzzleSubmissionStatus.PUBLISHED).length,
      featuredCount: submissions.filter(s => s.status === PuzzleSubmissionStatus.FEATURED).length,
    });
  }

  private async checkLevelUp(userId: string, currentStats: CreatorStats): Promise<void> {
    const currentLevel = this.getCreatorLevel(currentStats.totalPoints);
    
    if (currentStats.currentLevel < currentLevel.level) {
      // User leveled up!
      await this.processRewardEvent({
        type: 'milestone_reached',
        userId,
        points: currentLevel.minPoints - this.creatorLevels[currentStats.currentLevel - 1]?.minPoints || 0,
        metadata: {
          milestone: 'level_up',
          newLevel: currentLevel.level,
          newTitle: currentLevel.title,
        },
      });
      
      this.logger.log(`Creator ${userId} leveled up to ${currentLevel.title} (Level ${currentLevel.level})`);
    }
  }

  private async checkAchievements(userId: string, event: RewardEvent): Promise<void> {
    const achievements: string[] = [];
    
    // Check for various achievements based on events
    if (event.type === 'puzzle_play') {
      const totalPlays = await this.getTotalPlays(userId);
      if (totalPlays >= 1000) achievements.push('Puzzle Master - 1000 Plays');
      if (totalPlays >= 5000) achievements.push('Puzzle Legend - 5000 Plays');
    }
    
    if (event.type === 'puzzle_featured') {
      const featuredCount = await this.getFeaturedCount(userId);
      if (featuredCount >= 1) achievements.push('Featured Creator');
      if (featuredCount >= 5) achievements.push('Star Creator');
      if (featuredCount >= 10) achievements.push('Superstar Creator');
    }
    
    // Award achievement points
    for (const achievement of achievements) {
      await this.processRewardEvent({
        type: 'milestone_reached',
        userId,
        points: 25, // 25 points per achievement
        metadata: {
          milestone: 'achievement',
          achievement,
        },
      });
    }
  }

  private async updateMonthlyEarnings(userId: string, points: number): Promise<void> {
    // In a real implementation, this would update monthly earnings in a rewards table
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    this.logger.log(`Updated monthly earnings for ${userId}: +${points} points for ${currentMonth}`);
  }

  private async getMonthlyEarnings(userId: string): Promise<Record<string, number>> {
    // In a real implementation, this would query the earnings table
    return {};
  }

  private async getCreatorAchievements(userId: string): Promise<string[]> {
    // In a real implementation, this would query the achievements table
    return [];
  }

  private async getTotalPlays(userId: string): Promise<number> {
    const submissions = await this.submissionRepository.find({
      where: { userId, status: PuzzleSubmissionStatus.PUBLISHED },
    });
    
    return submissions.reduce((sum, s) => sum + s.playCount, 0);
  }

  private async getFeaturedCount(userId: string): Promise<number> {
    const submissions = await this.submissionRepository.find({
      where: { userId, status: PuzzleSubmissionStatus.FEATURED },
    });
    
    return submissions.length;
  }
}
