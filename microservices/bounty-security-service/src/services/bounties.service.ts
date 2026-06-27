import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Bounty, RewardTier } from '../entities/bounty.entity';
import { BountyStatus, SeverityTier } from '../entities/report-status.enum';
import { CreateBountyDto, UpdateBountyDto } from '../dto/bounty.dto';

/**
 * Default per-tier reward amounts. Used when a bounty doesn't
 * define its own tiers. Read once at module load.
 */
const DEFAULT_TIERS: Record<SeverityTier, { min: number; max: number }> = {
  [SeverityTier.CRITICAL]: {
    min: parseInt(process.env.DEFAULT_REWARD_CRITICAL ?? '5000', 10),
    max: parseInt(process.env.DEFAULT_REWARD_CRITICAL ?? '5000', 10),
  },
  [SeverityTier.HIGH]: {
    min: parseInt(process.env.DEFAULT_REWARD_HIGH ?? '2000', 10),
    max: parseInt(process.env.DEFAULT_REWARD_HIGH ?? '2000', 10),
  },
  [SeverityTier.MEDIUM]: {
    min: parseInt(process.env.DEFAULT_REWARD_MEDIUM ?? '750', 10),
    max: parseInt(process.env.DEFAULT_REWARD_MEDIUM ?? '750', 10),
  },
  [SeverityTier.LOW]: {
    min: parseInt(process.env.DEFAULT_REWARD_LOW ?? '250', 10),
    max: parseInt(process.env.DEFAULT_REWARD_LOW ?? '250', 10),
  },
  [SeverityTier.INFO]: {
    min: parseInt(process.env.DEFAULT_REWARD_INFO ?? '50', 10),
    max: parseInt(process.env.DEFAULT_REWARD_INFO ?? '50', 10),
  },
};

@Injectable()
export class BountiesService {
  private readonly logger = new Logger(BountiesService.name);

  constructor(@InjectRepository(Bounty) private readonly repo: Repository<Bounty>) {}

  async create(dto: CreateBountyDto): Promise<Bounty> {
    if (await this.repo.findOne({ where: { slug: dto.slug } })) {
      throw new ConflictException(`Bounty with slug "${dto.slug}" already exists`);
    }
    const tiers = (dto.tiers ?? this.defaultTiers(dto.currency ?? 'USD')) as RewardTier[];
    const bounty = this.repo.create({
      slug: dto.slug,
      name: dto.name,
      description: dto.description,
      scope: dto.scope ?? [],
      outOfScope: dto.outOfScope ?? [],
      tiers,
      currency: dto.currency ?? 'USD',
      status: dto.status ?? BountyStatus.DRAFT,
      budgetCap: dto.budgetCap ?? null,
      paidOut: 0,
      createdBy: dto.createdBy,
      opensAt: dto.opensAt ?? null,
      closesAt: dto.closesAt ?? null,
    });
    return this.repo.save(bounty);
  }

  async update(id: string, dto: UpdateBountyDto): Promise<Bounty> {
    const bounty = await this.findById(id);
    Object.assign(bounty, dto);
    return this.repo.save(bounty);
  }

  async findById(id: string): Promise<Bounty> {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException(`Bounty ${id} not found`);
    return b;
  }

  async findBySlug(slug: string): Promise<Bounty | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async list(page = 1, limit = 50, status?: BountyStatus) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const [data, total] = await this.repo.findAndCount({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { data, total, page: safePage, limit: safeLimit };
  }

  /**
   * Pick the reward for a given severity. Uses the bounty's tiers if present,
   * otherwise falls back to global defaults. Returns the midpoint of the range
   * so the security team has room to approve a higher or lower amount.
   */
  resolveRewardAmount(
    bounty: Bounty,
    severity: SeverityTier,
  ): { min: number; max: number; currency: string; suggested: number } {
    const tier = bounty.tiers.find((t) => t.severity === severity);
    if (tier) {
      return {
        min: tier.minAmount,
        max: tier.maxAmount,
        currency: tier.currency,
        suggested: Math.round((tier.minAmount + tier.maxAmount) / 2),
      };
    }
    const def = DEFAULT_TIERS[severity];
    return {
      min: def.min,
      max: def.max,
      currency: bounty.currency,
      suggested: Math.round((def.min + def.max) / 2),
    };
  }

  /**
   * Add `amount` to a bounty's running paidOut total.
   * Pass a TypeORM EntityManager to participate in an outer transaction;
   * otherwise the call uses its own connection.
   */
  async recordCost(
    bountyId: string,
    amount: number,
    manager?: EntityManager,
  ): Promise<Bounty> {
    const repo = manager ? manager.getRepository(Bounty) : this.repo;
    const b = await repo.findOne({ where: { id: bountyId } });
    if (!b) throw new NotFoundException(`Bounty ${bountyId} not found`);
    const next = Number(b.paidOut) + amount;
    if (b.budgetCap != null && next > Number(b.budgetCap)) {
      throw new BadRequestException(
        `Bounty budget exceeded: paidOut=${next} cap=${b.budgetCap}`,
      );
    }
    b.paidOut = next;
    return repo.save(b);
  }

  private defaultTiers(currency: string): RewardTier[] {
    return (Object.keys(DEFAULT_TIERS) as SeverityTier[]).map((s) => {
      const range = DEFAULT_TIERS[s];
      return { severity: s, minAmount: range.min, maxAmount: range.max, currency };
    });
  }
}
