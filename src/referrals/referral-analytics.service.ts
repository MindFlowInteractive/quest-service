import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { ReferralCode } from './entities/referral-code.entity';
import {
  ReferralAnalyticsDto,
  ReferralAnalyticsPeriod,
} from './dto/referral-analytics.dto';
import { ReferralStatus } from './entities/referral.entity';

export interface ReferralAnalytics {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsDistributed: number;
  referrerRewards: number;
  refereeRewards: number;
  conversionRate: number;
  averageRewardsPerReferral: number;
  referralsByStatus: Record<ReferralStatus, number>;
  referralsByPeriod: Array<{
    period: string;
    count: number;
    completed: number;
  }>;
  topReferrers: Array<{
    userId: string;
    username: string;
    count: number;
    rewards: number;
  }>;
}

@Injectable()
export class ReferralAnalyticsService {
  private readonly logger = new Logger(ReferralAnalyticsService.name);

  constructor(
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(ReferralCode)
    private readonly referralCodeRepository: Repository<ReferralCode>,
  ) {}

  /**
   * Get comprehensive referral analytics
   */
  async getAnalytics(
    dto: ReferralAnalyticsDto,
  ): Promise<ReferralAnalytics> {
    const { startDate, endDate, period, userId } = dto;

    // Build date range
    let dateRange: { start: Date; end: Date } | null = null;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    } else if (period && period !== ReferralAnalyticsPeriod.ALL_TIME) {
      dateRange = this.getPeriodDateRange(period);
    }

    // Build where clause
    const whereClause: any = {};
    if (userId) {
      whereClause.referrerId = userId;
    }
    if (dateRange) {
      whereClause.createdAt = Between(dateRange.start, dateRange.end);
    }

    // Get all referrals
    const referrals = await this.referralRepository.find({
      where: whereClause,
      relations: ['referrer', 'referee'],
    });

    // Calculate metrics
    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.COMPLETED,
    ).length;
    const pendingReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.PENDING,
    ).length;

    const totalRewardsDistributed =
      referrals
        .filter((r) => r.referrerRewarded)
        .reduce((sum, r) => sum + r.referrerReward, 0) +
      referrals
        .filter((r) => r.refereeRewarded)
        .reduce((sum, r) => sum + r.refereeReward, 0);

    const referrerRewards = referrals
      .filter((r) => r.referrerRewarded)
      .reduce((sum, r) => sum + r.referrerReward, 0);

    const refereeRewards = referrals
      .filter((r) => r.refereeRewarded)
      .reduce((sum, r) => sum + r.refereeReward, 0);

    const conversionRate =
      totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

    const averageRewardsPerReferral =
      completedReferrals > 0
        ? totalRewardsDistributed / completedReferrals
        : 0;

    // Referrals by status
    const referralsByStatus = referrals.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<ReferralStatus, number>,
    );

    // Referrals by period
    const referralsByPeriod = this.groupReferralsByPeriod(
      referrals,
      period || ReferralAnalyticsPeriod.DAY,
    );

    // Top referrers
    const topReferrers = await this.getTopReferrers(
      userId,
      dateRange,
      10,
    );

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalRewardsDistributed,
      referrerRewards,
      refereeRewards,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageRewardsPerReferral: Math.round(averageRewardsPerReferral * 100) / 100,
      referralsByStatus,
      referralsByPeriod,
      topReferrers,
    };
  }

  /**
   * Get date range for a period
   */
  private getPeriodDateRange(
    period: ReferralAnalyticsPeriod,
  ): { start: Date; end: Date } {
    const end = new Date();
    let start = new Date();

    switch (period) {
      case ReferralAnalyticsPeriod.DAY:
        start.setDate(start.getDate() - 1);
        break;
      case ReferralAnalyticsPeriod.WEEK:
        start.setDate(start.getDate() - 7);
        break;
      case ReferralAnalyticsPeriod.MONTH:
        start.setMonth(start.getMonth() - 1);
        break;
      case ReferralAnalyticsPeriod.YEAR:
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }

  /**
   * Group referrals by period
   */
  private groupReferralsByPeriod(
    referrals: Referral[],
    period: ReferralAnalyticsPeriod,
  ): Array<{ period: string; count: number; completed: number }> {
    const groups: Map<string, { count: number; completed: number }> = new Map();

    referrals.forEach((referral) => {
      let key: string;
      const date = new Date(referral.createdAt);

      switch (period) {
        case ReferralAnalyticsPeriod.DAY:
          key = date.toISOString().split('T')[0];
          break;
        case ReferralAnalyticsPeriod.WEEK:
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case ReferralAnalyticsPeriod.MONTH:
          const month = date.getMonth() + 1;
          key = `${date.getFullYear()}-${month < 10 ? '0' : ''}${month}`;
          break;
        case ReferralAnalyticsPeriod.YEAR:
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groups.has(key)) {
        groups.set(key, { count: 0, completed: 0 });
      }

      const group = groups.get(key)!;
      group.count++;
      if (referral.status === ReferralStatus.COMPLETED) {
        group.completed++;
      }
    });

    return Array.from(groups.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get top referrers
   */
  private async getTopReferrers(
    userId?: string,
    dateRange?: { start: Date; end: Date } | null,
    limit: number = 10,
  ): Promise<
    Array<{
      userId: string;
      username: string;
      count: number;
      rewards: number;
    }>
  > {
    const queryBuilder = this.referralCodeRepository
      .createQueryBuilder('rc')
      .leftJoin('rc.user', 'user')
      .select([
        'rc.userId',
        'user.username',
        'rc.totalReferrals',
        'rc.totalRewardsEarned',
      ])
      .where('rc.isActive = :isActive', { isActive: true })
      .andWhere('user.status = :status', { status: 'active' });

    if (userId) {
      queryBuilder.andWhere('rc.userId = :userId', { userId });
    }

    if (dateRange) {
      queryBuilder.andWhere('rc.createdAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    queryBuilder
      .orderBy('rc.totalReferrals', 'DESC')
      .addOrderBy('rc.totalRewardsEarned', 'DESC')
      .limit(limit);

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      userId: result.rc_userId,
      username: result.user_username || 'Unknown',
      count: result.rc_totalReferrals || 0,
      rewards: result.rc_totalRewardsEarned || 0,
    }));
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(userId?: string): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    totalRewards: number;
    recentReferrals: Array<{
      id: string;
      refereeId: string;
      refereeUsername: string;
      status: ReferralStatus;
      createdAt: Date;
    }>;
  }> {
    const whereClause: any = {};
    if (userId) {
      whereClause.referrerId = userId;
    }

    const [referrals, recentReferrals] = await Promise.all([
      this.referralRepository.find({ where: whereClause }),
      this.referralRepository.find({
        where: whereClause,
        relations: ['referee'],
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);

    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.PENDING,
    ).length;
    const completedReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.COMPLETED,
    ).length;
    const totalRewards = referrals
      .filter((r) => r.referrerRewarded)
      .reduce((sum, r) => sum + r.referrerReward, 0);

    return {
      totalReferrals,
      activeReferrals,
      completedReferrals,
      totalRewards,
      recentReferrals: recentReferrals.map((r) => ({
        id: r.id,
        refereeId: r.refereeId,
        refereeUsername: (r.referee as any)?.username || 'Unknown',
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }
}
