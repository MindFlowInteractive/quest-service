import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralCode } from './entities/referral-code.entity';
import { ReferralLeaderboardType } from './dto/referral-leaderboard.dto';

export interface ReferralLeaderboardEntry {
  userId: string;
  username: string;
  code: string;
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  totalRewardsEarned: number;
  rank: number;
}

@Injectable()
export class ReferralLeaderboardService {
  private readonly logger = new Logger(ReferralLeaderboardService.name);

  constructor(
    @InjectRepository(ReferralCode)
    private readonly referralCodeRepository: Repository<ReferralCode>,
  ) {}

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(
    type: ReferralLeaderboardType = ReferralLeaderboardType.TOTAL_REFERRALS,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{
    entries: ReferralLeaderboardEntry[];
    total: number;
    type: ReferralLeaderboardType;
  }> {
    const queryBuilder = this.referralCodeRepository
      .createQueryBuilder('rc')
      .leftJoin('rc.user', 'user')
      .select([
        'rc.userId',
        'user.username',
        'rc.code',
        'rc.totalReferrals',
        'rc.activeReferrals',
        'rc.totalRewardsEarned',
      ])
      .where('rc.isActive = :isActive', { isActive: true })
      .andWhere('user.status = :status', { status: 'active' });

    // Add completed referrals count using subquery
    queryBuilder
      .leftJoin(
        'referrals',
        'r',
        'r.referralCodeId = rc.id AND r.status = :completedStatus',
        { completedStatus: 'completed' },
      )
      .addSelect('COUNT(r.id)', 'completedReferrals')
      .groupBy('rc.id')
      .addGroupBy('user.id')
      .addGroupBy('user.username')
      .addGroupBy('rc.code')
      .addGroupBy('rc.totalReferrals')
      .addGroupBy('rc.activeReferrals')
      .addGroupBy('rc.totalRewardsEarned')
      .addGroupBy('rc.createdAt');

    // Order by type
    switch (type) {
      case ReferralLeaderboardType.TOTAL_REFERRALS:
        queryBuilder.orderBy('rc.totalReferrals', 'DESC');
        break;
      case ReferralLeaderboardType.ACTIVE_REFERRALS:
        queryBuilder.orderBy('rc.activeReferrals', 'DESC');
        break;
      case ReferralLeaderboardType.REWARDS_EARNED:
        queryBuilder.orderBy('rc.totalRewardsEarned', 'DESC');
        break;
    }

    // Add secondary sort for consistency
    queryBuilder.addOrderBy('rc.totalReferrals', 'DESC');
    queryBuilder.addOrderBy('rc.createdAt', 'ASC');

    // Get total count (before pagination, need separate query due to GROUP BY)
    const countQuery = this.referralCodeRepository
      .createQueryBuilder('rc')
      .leftJoin('rc.user', 'user')
      .where('rc.isActive = :isActive', { isActive: true })
      .andWhere('user.status = :status', { status: 'active' });
    const total = await countQuery.getCount();

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    const results = await queryBuilder.getRawMany();

    // Map results and add rank
    const entries: ReferralLeaderboardEntry[] = results.map(
      (result, index) => ({
        userId: result.rc_userId,
        username: result.user_username || 'Unknown',
        code: result.rc_code,
        totalReferrals: result.rc_totalReferrals || 0,
        activeReferrals: result.rc_activeReferrals || 0,
        completedReferrals: parseInt(result.completedReferrals || '0', 10),
        totalRewardsEarned: result.rc_totalRewardsEarned || 0,
        rank: offset + index + 1,
      }),
    );

    return {
      entries,
      total,
      type,
    };
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(
    userId: string,
    type: ReferralLeaderboardType = ReferralLeaderboardType.TOTAL_REFERRALS,
  ): Promise<number | null> {
    const referralCode = await this.referralCodeRepository.findOne({
      where: { userId },
    });

    if (!referralCode || !referralCode.isActive) {
      return null;
    }

    const queryBuilder = this.referralCodeRepository
      .createQueryBuilder('rc')
      .where('rc.isActive = :isActive', { isActive: true });

    // Order by type
    switch (type) {
      case ReferralLeaderboardType.TOTAL_REFERRALS:
        queryBuilder
          .andWhere(
            '(rc.totalReferrals > :value OR (rc.totalReferrals = :value AND rc.createdAt < :createdAt))',
            {
              value: referralCode.totalReferrals,
              createdAt: referralCode.createdAt,
            },
          )
          .orderBy('rc.totalReferrals', 'DESC');
        break;
      case ReferralLeaderboardType.ACTIVE_REFERRALS:
        queryBuilder
          .andWhere(
            '(rc.activeReferrals > :value OR (rc.activeReferrals = :value AND rc.createdAt < :createdAt))',
            {
              value: referralCode.activeReferrals,
              createdAt: referralCode.createdAt,
            },
          )
          .orderBy('rc.activeReferrals', 'DESC');
        break;
      case ReferralLeaderboardType.REWARDS_EARNED:
        queryBuilder
          .andWhere(
            '(rc.totalRewardsEarned > :value OR (rc.totalRewardsEarned = :value AND rc.createdAt < :createdAt))',
            {
              value: referralCode.totalRewardsEarned,
              createdAt: referralCode.createdAt,
            },
          )
          .orderBy('rc.totalRewardsEarned', 'DESC');
        break;
    }

    const count = await queryBuilder.getCount();
    return count + 1; // Rank is 1-indexed
  }
}
