import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplayAnalytic } from '../entities/replay-analytic.entity';
import { PuzzleReplay } from '../entities/puzzle-replay.entity';

/**
 * Service for analyzing replay data and extracting learning insights
 * Tracks metrics for improving puzzle difficulty, understanding player behavior, etc.
 */
@Injectable()
export class ReplayAnalyticsService {
  constructor(
    @InjectRepository(ReplayAnalytic)
    private readonly analyticRepo: Repository<ReplayAnalytic>,
    @InjectRepository(PuzzleReplay)
    private readonly replayRepo: Repository<PuzzleReplay>,
  ) {}

  /**
   * Record a view event for analytics tracking
   */
  async recordView(replayId: string, viewerUserId?: string): Promise<ReplayAnalytic> {
    const analytic = this.analyticRepo.create({
      replayId,
      metricType: 'VIEW',
      metricValue: {
        viewedAt: new Date().toISOString(),
        viewerUserId: viewerUserId || 'anonymous',
      },
    });

    return this.analyticRepo.save(analytic);
  }

  /**
   * Record learning effectiveness metric
   */
  async recordLearningEffectiveness(
    replayId: string,
    beforeScore: number,
    afterScore: number,
  ): Promise<ReplayAnalytic> {
    const improvement = afterScore - beforeScore;
    const improvementRate = beforeScore > 0 ? (improvement / beforeScore) * 100 : 0;

    const analytic = this.analyticRepo.create({
      replayId,
      metricType: 'LEARNING_EFFECTIVENESS',
      metricValue: {
        beforeScore,
        afterScore,
        improvement,
        improvementRate: Math.round(improvementRate * 100) / 100,
        recordedAt: new Date().toISOString(),
      },
    });

    return this.analyticRepo.save(analytic);
  }

  /**
   * Record strategy pattern for analysis
   */
  async recordStrategyPattern(
    replayId: string,
    pattern: string,
    successRate: number,
  ): Promise<ReplayAnalytic> {
    const analytic = this.analyticRepo.create({
      replayId,
      metricType: 'STRATEGY_PATTERN',
      metricValue: {
        pattern,
        frequency: 1,
        successRate,
        recordedAt: new Date().toISOString(),
      },
    });

    return this.analyticRepo.save(analytic);
  }

  /**
   * Record difficulty rating from player feedback
   */
  async recordDifficultyRating(
    replayId: string,
    rating: number, // 1-5
  ): Promise<ReplayAnalytic> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const analytic = this.analyticRepo.create({
      replayId,
      metricType: 'DIFFICULTY_RATING',
      metricValue: {
        rating,
        votes: 1,
        recordedAt: new Date().toISOString(),
      },
    });

    return this.analyticRepo.save(analytic);
  }

  /**
   * Get view count for a replay
   */
  async getViewCount(replayId: string): Promise<number> {
    const views = await this.analyticRepo.count({
      where: {
        replayId,
        metricType: 'VIEW',
      },
    });

    return views;
  }

  /**
   * Get top replays by views for a puzzle
   */
  async getTopReplaysByViews(
    puzzleId: string,
    limit: number = 10,
  ): Promise<Array<{ replayId: string; viewCount: number }>> {
    const query = `
      SELECT DISTINCT 
        a.replayId,
        COUNT(CASE WHEN a.metricType = 'VIEW' THEN 1 END) as viewCount
      FROM replay_analytics a
      JOIN puzzle_replays pr ON a.replayId = pr.id
      WHERE pr.puzzleId = $1 AND a.metricType = 'VIEW'
      GROUP BY a.replayId
      ORDER BY viewCount DESC
      LIMIT $2
    `;

    const results = await this.analyticRepo.query(query, [puzzleId, limit]);

    return results.map((r: any) => ({
      replayId: r.replayId,
      viewCount: parseInt(r.viewCount, 10),
    }));
  }

  /**
   * Get learning effectiveness summary for a puzzle
   */
  async getLearningEffectivenessSummary(
    puzzleId: string,
  ): Promise<{
    averageImprovement: number;
    totalViews: number;
    improvementRate: number;
  }> {
    const query = `
      SELECT 
        AVG((metricValue->>'improvement')::numeric) as avgImprovement,
        COUNT(CASE WHEN metricType = 'VIEW' THEN 1 END) as viewCount,
        COUNT(DISTINCT replayId) as uniqueReplays
      FROM replay_analytics a
      JOIN puzzle_replays pr ON a.replayId = pr.id
      WHERE pr.puzzleId = $1 AND a.metricType IN ('LEARNING_EFFECTIVENESS', 'VIEW')
    `;

    const results = await this.analyticRepo.query(query, [puzzleId]);

    const result = results[0];

    return {
      averageImprovement: result.avgimprovement ? parseFloat(result.avgimprovement) : 0,
      totalViews: parseInt(result.viewCount, 10),
      improvementRate:
        result.improvementrate !== null ? parseFloat(result.improvementrate) : 0,
    };
  }

  /**
   * Get common strategies for a puzzle
   */
  async getCommonStrategies(
    puzzleId: string,
    limit: number = 5,
  ): Promise<Array<{ pattern: string; frequency: number; successRate: number }>> {
    const query = `
      SELECT 
        metricValue->>'pattern' as pattern,
        COUNT(*) as frequency,
        AVG((metricValue->>'successRate')::numeric) as avgSuccessRate
      FROM replay_analytics
      WHERE metricType = 'STRATEGY_PATTERN'
        AND replayId IN (
          SELECT id FROM puzzle_replays WHERE puzzleId = $1
        )
      GROUP BY pattern
      ORDER BY frequency DESC
      LIMIT $2
    `;

    const results = await this.analyticRepo.query(query, [puzzleId, limit]);

    return results.map((r: any) => ({
      pattern: r.pattern,
      frequency: parseInt(r.frequency, 10),
      successRate: parseFloat(r.avgsuccessrate),
    }));
  }

  /**
   * Get difficulty feedback for a puzzle
   */
  async getDifficultyFeedback(
    puzzleId: string,
  ): Promise<{ averageRating: number; voteCount: number; distribution: Record<number, number> }> {
    const query = `
      SELECT 
        (metricValue->>'rating')::numeric as rating,
        (metricValue->>'votes')::numeric as votes
      FROM replay_analytics
      WHERE metricType = 'DIFFICULTY_RATING'
        AND replayId IN (
          SELECT id FROM puzzle_replays WHERE puzzleId = $1
        )
    `;

    const results = await this.analyticRepo.query(query, [puzzleId]);

    if (results.length === 0) {
      return { averageRating: 0, voteCount: 0, distribution: {} };
    }

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;
    let voteCount = 0;

    for (const result of results) {
      const rating = Math.round(parseFloat(result.rating));
      const votes = parseInt(result.votes, 10);

      distribution[rating] = (distribution[rating] || 0) + votes;
      totalRating += rating * votes;
      voteCount += votes;
    }

    const averageRating = voteCount > 0 ? totalRating / voteCount : 0;

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      voteCount,
      distribution,
    };
  }

  /**
   * Get puzzle completion analytics
   */
  async getCompletionAnalytics(
    puzzleId: string,
  ): Promise<{
    totalReplays: number;
    completedReplays: number;
    solvedReplays: number;
    completionRate: number;
    solveRate: number;
    averageTime: number;
    averageScore: number;
  }> {
    const replays = await this.replayRepo
      .createQueryBuilder('replay')
      .where('replay.puzzleId = :puzzleId', { puzzleId })
      .getMany();

    const totalReplays = replays.length;
    const completedReplays = replays.filter((r) => r.isCompleted).length;
    const solvedReplays = replays.filter((r) => r.isSolved).length;

    const completedWithTime = replays.filter((r) => r.isCompleted && r.totalDuration > 0);
    const completedWithScore = replays.filter((r) => r.isCompleted && r.scoreEarned !== null);

    const averageTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce((sum, r) => sum + r.totalDuration, 0) / completedWithTime.length
        : 0;

    const averageScore =
      completedWithScore.length > 0
        ? completedWithScore.reduce((sum, r) => sum + (r.scoreEarned || 0), 0) /
          completedWithScore.length
        : 0;

    const completionRate =
      totalReplays > 0 ? (completedReplays / totalReplays) * 100 : 0;
    const solveRate = totalReplays > 0 ? (solvedReplays / totalReplays) * 100 : 0;

    return {
      totalReplays,
      completedReplays,
      solvedReplays,
      completionRate: Math.round(completionRate * 100) / 100,
      solveRate: Math.round(solveRate * 100) / 100,
      averageTime: Math.round(averageTime),
      averageScore: Math.round(averageScore * 100) / 100,
    };
  }

  /**
   * Get player learning progress across puzzles
   */
  async getPlayerLearningProgress(
    userId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      puzzleId: string;
      puzzleTitle: string;
      firstAttemptScore: number;
      bestScore: number;
      improvement: number;
      attempts: number;
      lastAttemptDate: Date;
    }>
  > {
    const replays = await this.replayRepo
      .createQueryBuilder('replay')
      .where('replay.userId = :userId', { userId })
      .orderBy('replay.createdAt', 'DESC')
      .take(limit)
      .getMany();

    // Group by puzzle
    const puzzleMap = new Map<
      string,
      {
        puzzleTitle: string;
        scores: number[];
        dates: Date[];
      }
    >();

    for (const replay of replays) {
      if (!puzzleMap.has(replay.puzzleId)) {
        puzzleMap.set(replay.puzzleId, {
          puzzleTitle: replay.puzzleTitle,
          scores: [],
          dates: [],
        });
      }

      const data = puzzleMap.get(replay.puzzleId)!;
      if (replay.scoreEarned !== null) {
        data.scores.push(replay.scoreEarned);
      }
      data.dates.push(replay.createdAt);
    }

    const progress = [];
    for (const [puzzleId, data] of puzzleMap) {
      if (data.scores.length > 0) {
        const firstScore = data.scores[data.scores.length - 1];
        const bestScore = Math.max(...data.scores);
        const improvement = bestScore - firstScore;

        progress.push({
          puzzleId,
          puzzleTitle: data.puzzleTitle,
          firstAttemptScore: firstScore,
          bestScore,
          improvement,
          attempts: data.scores.length,
          lastAttemptDate: data.dates[0],
        });
      }
    }

    return progress.sort((a, b) => b.improvement - a.improvement);
  }

  /**
   * Clean up old analytics data (older than X days)
   */
  async cleanupOldAnalytics(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.analyticRepo
      .createQueryBuilder()
      .delete()
      .where('recordedAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
