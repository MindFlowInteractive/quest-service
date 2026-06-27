import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Researcher } from '../entities/researcher.entity';
import { VulnerabilityReport } from '../entities/report.entity';
import { Reward } from '../entities/reward.entity';
import { ReportStatus, RewardStatus } from '../entities/report-status.enum';

/**
 * Pre-computed leaderboard entry. Avoids the typeorm query-builder incantation
 * at call sites and keeps the public response shape stable.
 */
export interface ResearcherRank {
  rank: number;
  researcherId: string;
  handle: string;
  displayName: string | null;
  reputation: number;
  acceptedReports: number;
  totalReports: number;
  totalEarned: number;
  rank_: string;
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRepository(Researcher)
    private readonly researcherRepo: Repository<Researcher>,
    @InjectRepository(VulnerabilityReport)
    private readonly reportsRepo: Repository<VulnerabilityReport>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
  ) {}

  /**
   * Global top researchers by reputation. Optionally filter to a time window.
   */
  async topResearchers(opts: {
    period?: 'all' | 'month' | 'week';
    bountyId?: string;
    limit?: number;
  }): Promise<ResearcherRank[]> {
    const limit = Math.max(1, Math.min(100, opts.limit ?? 25));
    const baseQuery = this.researcherRepo
      .createQueryBuilder('r')
      .where('r.is_blocked = false');

    // If period or bounty is set, restrict to researchers with accepted reports in window.
    if (opts.period && opts.period !== 'all') {
      const since = this.since(opts.period);
      const recentResearcherIds = this.reportsRepo
        .createQueryBuilder('rep')
        .select('DISTINCT rep.researcher_id', 'researcher_id')
        .where('rep.status IN (:...statuses)', {
          statuses: ['verified', 'fixed'],
        })
        .andWhere('rep.updated_at >= :since', { since })
        .getSql();
      baseQuery.andWhere(`r.id IN (${recentResearcherIds})`, { since });
    }

    if (opts.bountyId) {
      const inBounty = this.reportsRepo
        .createQueryBuilder('rep')
        .select('DISTINCT rep.researcher_id', 'researcher_id')
        .where('rep.bounty_id = :bountyId', { bountyId: opts.bountyId })
        .getSql();
      baseQuery.andWhere(`r.id IN (${inBounty})`);
    }

    const rows = await baseQuery
      .orderBy('r.reputation', 'DESC')
      .addOrderBy('r.accepted_reports', 'DESC')
      .limit(limit)
      .getMany();

    return rows.map((r, idx) => ({
      rank: idx + 1,
      researcherId: r.id,
      handle: r.handle,
      displayName: r.displayName,
      reputation: r.reputation,
      acceptedReports: r.acceptedReports,
      totalReports: r.totalReports,
      totalEarned: Number(r.totalEarned),
      rank_: r.rank,
    }));
  }

  /**
   * Top researchers who collected rewards from a specific bounty program.
   * Uses a single raw grouped query against rewards and hydrates the
   * researcher rows in a second step.
   */
  async topResearchersPerBounty(bountyId: string, limit = 10): Promise<ResearcherRank[]> {
    const limitSafe = Math.max(1, Math.min(100, limit));
    const sums: Array<{ researcherId: string; paid: string }> = await this.rewardRepo
      .createQueryBuilder('rw')
      .select('rw.researcher_id', 'researcherId')
      .addSelect('SUM(rw.amount)', 'paid')
      .where('rw.bounty_id = :bountyId', { bountyId })
      .andWhere('rw.status = :status', { status: RewardStatus.PAID })
      .groupBy('rw.researcher_id')
      .orderBy('SUM(rw.amount)', 'DESC')
      .limit(limitSafe)
      .getRawMany();

    if (sums.length === 0) return [];

    const researchers = await this.researcherRepo.findBy({
      id: In(sums.map((s) => s.researcherId)),
    });

    return sums.map((sum, idx) => {
      const r = researchers.find((rr) => rr.id === sum.researcherId);
      return {
        rank: idx + 1,
        researcherId: sum.researcherId,
        handle: r?.handle ?? 'unknown',
        displayName: r?.displayName ?? null,
        reputation: r?.reputation ?? 0,
        acceptedReports: r?.acceptedReports ?? 0,
        totalReports: r?.totalReports ?? 0,
        totalEarned: Number(sum.paid ?? 0),
        rank_: r?.rank ?? 'bronze',
      };
    });
  }

  /**
   * Snapshot stats for the whole service.
   */
  async globalStats() {
    const [researchers, reports, rewards] = await Promise.all([
      this.researcherRepo.count(),
      this.reportsRepo.count(),
      this.rewardRepo.count({ where: { status: 'paid' as any } }),
    ]);
    return {
      totalResearchers: researchers,
      totalReports: reports,
      paidRewards: rewards,
    };
  }

  private since(period: 'month' | 'week'): Date {
    const date = new Date();
    if (period === 'month') date.setMonth(date.getMonth() - 1);
    if (period === 'week') date.setDate(date.getDate() - 7);
    return date;
  }
}
