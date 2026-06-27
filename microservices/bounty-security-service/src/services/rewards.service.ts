import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { Researcher } from '../entities/researcher.entity';
import { VulnerabilityReport } from '../entities/report.entity';
import { RewardStatus } from '../entities/report-status.enum';
import {
  ApproveRewardDto,
  PayRewardDto,
  UpdateRewardStatusDto,
} from '../dto/reward.dto';
import { BountiesService } from './bounties.service';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(Reward) private readonly repo: Repository<Reward>,
    @InjectRepository(Researcher) private readonly researcherRepo: Repository<Researcher>,
    @InjectRepository(VulnerabilityReport)
    private readonly reportsRepo: Repository<VulnerabilityReport>,
    private readonly bountiesService: BountiesService,
  ) {}

  /**
   * Create a pending reward row for a report that has just been marked FIXED.
   * Idempotent on (reportId) — re-entry is safe.
   */
  async createFromFix(
    reportId: string,
    researcherId: string,
    bountyId: string,
    amount: number,
    currency: string,
  ): Promise<Reward> {
    const existing = await this.repo.findOne({ where: { reportId } });
    if (existing) return existing;

    const reward = this.repo.create({
      reportId,
      researcherId,
      bountyId,
      amount,
      currency,
      status: RewardStatus.PENDING,
    });
    return this.repo.save(reward);
  }

  async getById(id: string): Promise<Reward> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Reward ${id} not found`);
    return r;
  }

  async list(filter: {
    status?: RewardStatus;
    researcherId?: string;
    bountyId?: string;
    page?: number;
    limit?: number;
  }) {
    const safePage = Math.max(1, filter.page ?? 1);
    const safeLimit = Math.max(1, Math.min(100, filter.limit ?? 20));
    const where: Record<string, any> = {};
    if (filter.status) where.status = filter.status;
    if (filter.researcherId) where.researcherId = filter.researcherId;
    if (filter.bountyId) where.bountyId = filter.bountyId;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  async findByReport(reportId: string): Promise<Reward | null> {
    return this.repo.findOne({ where: { reportId } });
  }

  async approve(id: string, dto: ApproveRewardDto): Promise<Reward> {
    const reward = await this.getById(id);
    if (reward.status === RewardStatus.PAID) {
      throw new BadRequestException(`Reward ${id} is already PAID and cannot be modified`);
    }
    if (
      reward.status === RewardStatus.CANCELLED ||
      reward.status === RewardStatus.DISPUTED
    ) {
      throw new BadRequestException(
        `Reward ${id} is in status ${reward.status} and cannot be approved`,
      );
    }
    if (dto.amountOverride != null) {
      reward.amount = dto.amountOverride;
    }
    reward.status = RewardStatus.APPROVED;
    reward.approvedBy = dto.actor;
    reward.approvedAt = new Date();
    if (dto.notes) reward.notes = dto.notes;
    return this.repo.save(reward);
  }

  /**
   * Pay an APPROVED reward. Wraps the three side-effects (bounty budget,
   * researcher earnings, reward status) in a single DB transaction so a
   * partial failure cannot leave the system in an inconsistent state.
   */
  async pay(id: string, dto: PayRewardDto): Promise<Reward> {
    const queryRunner = this.repo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction('READ COMMITTED');
    try {
      const reward = await queryRunner.manager.findOne(Reward, { where: { id } });
      if (!reward) throw new NotFoundException(`Reward ${id} not found`);
      if (reward.status !== RewardStatus.APPROVED) {
        throw new BadRequestException(
          `Only APPROVED rewards can be paid (current: ${reward.status})`,
        );
      }

      // 1. Bump bounty paidOut through the same transaction.
      await this.bountiesService.recordCost(
        reward.bountyId,
        Number(reward.amount),
        queryRunner.manager,
      );

      // 2. Mark reward paid.
      reward.status = RewardStatus.PAID;
      reward.transactionRef = dto.transactionRef;
      reward.paidAt = new Date();
      if (dto.notes) reward.notes = dto.notes;
      const saved = await queryRunner.manager.save(reward);

      // 3. Bump researcher lifetime earnings.
      await queryRunner.manager
        .createQueryBuilder()
        .update()
        .set({
          totalEarned: () =>
            `"total_earned" + ${Number(reward.amount).toFixed(2)}`,
        })
        .where('id = :id', { id: reward.researcherId })
        .execute();

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, dto: UpdateRewardStatusDto): Promise<Reward> {
    const reward = await this.getById(id);
    reward.status = dto.status;
    if (dto.notes) reward.notes = dto.notes;
    return this.repo.save(reward);
  }

  async aggregateByBounty(bountyId: string): Promise<{
    totalPaid: number;
    totalPending: number;
    totalApproved: number;
    currency: string;
  }> {
    const rows = await this.repo.find({ where: { bountyId } });
    const result = {
      totalPaid: 0,
      totalPending: 0,
      totalApproved: 0,
      currency: 'USD',
    };
    for (const r of rows) {
      if (r.status === RewardStatus.PAID) result.totalPaid += Number(r.amount);
      if (r.status === RewardStatus.PENDING) result.totalPending += Number(r.amount);
      if (r.status === RewardStatus.APPROVED) result.totalApproved += Number(r.amount);
      result.currency = r.currency;
    }
    return result;
  }
}
