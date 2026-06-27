import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Researcher } from '../entities/researcher.entity';
import { RegisterResearcherDto, BlockResearcherDto } from '../dto/researcher.dto';
import { SeverityTier, ReportStatus } from '../entities/report-status.enum';

/**
 * Reward tiers mapped to reputation delta when a report is accepted.
 * Read from env so the program owner can tune without redeploying.
 */
const POINTS_BY_SEVERITY: Record<SeverityTier, number> = {
  [SeverityTier.CRITICAL]: parseInt(process.env.REPUTATION_ACCEPTED_CRITICAL ?? '100', 10),
  [SeverityTier.HIGH]: parseInt(process.env.REPUTATION_ACCEPTED_HIGH ?? '60', 10),
  [SeverityTier.MEDIUM]: parseInt(process.env.REPUTATION_ACCEPTED_MEDIUM ?? '30', 10),
  [SeverityTier.LOW]: parseInt(process.env.REPUTATION_ACCEPTED_LOW ?? '10', 10),
  [SeverityTier.INFO]: 0,
};

const REJECTION_PENALTY = parseInt(process.env.REPUTATION_REJECTED_PENALTY ?? '5', 10);

@Injectable()
export class ResearchersService {
  private readonly logger = new Logger(ResearchersService.name);

  constructor(@InjectRepository(Researcher) private readonly repo: Repository<Researcher>) {}

  /** Register a new researcher. Handle must be unique. */
  async register(dto: RegisterResearcherDto): Promise<Researcher> {
    const existing = await this.repo.findOne({ where: { handle: dto.handle } });
    if (existing) {
      throw new ConflictException(`Researcher handle "${dto.handle}" is already registered`);
    }
    const created = this.repo.create({
      handle: dto.handle,
      email: dto.email ?? null,
      displayName: dto.displayName ?? dto.handle,
      bio: dto.bio ?? null,
      website: dto.website ?? null,
    });
    return this.repo.save(created);
  }

  async findById(id: string): Promise<Researcher> {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException(`Researcher ${id} not found`);
    return r;
  }

  async findByHandle(handle: string): Promise<Researcher | null> {
    return this.repo.findOne({ where: { handle } });
  }

  async list(page = 1, limit = 50): Promise<{ data: Researcher[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const [data, total] = await this.repo.findAndCount({
      order: { reputation: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  /**
   * Block a researcher. Accepts either a UUID or a handle as `actor`.
   * `reason` is logged but not stored on the researcher entity.
   */
  async block(dto: BlockResearcherDto): Promise<Researcher> {
    const target =
      (await this.repo.findOne({ where: { id: dto.actor } })) ??
      (await this.repo.findOne({ where: { handle: dto.actor } }));
    if (!target) throw new NotFoundException(`Researcher "${dto.actor}" not found`);
    target.isBlocked = true;
    this.logger.warn(`Researcher ${target.handle} blocked: ${dto.reason}`);
    return this.repo.save(target);
  }

  async unblock(researcherId: string): Promise<Researcher> {
    const r = await this.findById(researcherId);
    r.isBlocked = false;
    return this.repo.save(r);
  }

  async incrementReportCounts(
    researcherId: string,
    outcome: 'submitted' | ReportStatus,
    severity: SeverityTier,
    bountyId: string | null,
    payoutAmount: number | null,
  ): Promise<Researcher> {
    const r = await this.findById(researcherId);

    if (outcome === 'submitted') {
      r.totalReports += 1;
      // New submissions don't count toward streak until they pass triage.
      return this.repo.save(r);
    }

    if (outcome === ReportStatus.VERIFIED || outcome === ReportStatus.FIXED) {
      // Counts as an accepted report. Weight streak and reputation by severity.
      r.acceptedReports += 1;
      r.streak += 1;
      r.reputation = Math.max(0, r.reputation + (POINTS_BY_SEVERITY[severity] ?? 0));
      r.rank = computeRank(r.reputation);

      if (outcome === ReportStatus.FIXED && payoutAmount && payoutAmount > 0) {
        r.totalEarned = Number(r.totalEarned) + payoutAmount;
      }
      return this.repo.save(r);
    }

    if (outcome === ReportStatus.REJECTED || outcome === ReportStatus.DUPLICATE) {
      r.rejectedReports += 1;
      r.streak = 0;
      r.reputation = Math.max(0, r.reputation - REJECTION_PENALTY);
      return this.repo.save(r);
    }

    // TRIAGED: count toward accepted only after verification.
    return this.repo.save(r);
  }

  /** Returns the explicit ranking for a reputation score. */
  rankFor(reputation: number): string {
    return computeRank(reputation);
  }
}

function computeRank(rep: number): string {
  if (rep >= 5000) return 'diamond';
  if (rep >= 2000) return 'platinum';
  if (rep >= 1000) return 'gold';
  if (rep >= 300) return 'silver';
  return 'bronze';
}
