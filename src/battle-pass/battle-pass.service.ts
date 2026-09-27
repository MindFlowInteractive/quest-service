import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BattlePass,
  BattlePassStatus,
} from './entities/battle-pass.entity';
import { BattlePassTier } from './entities/battle-pass-tier.entity';
import { PlayerBattlePass } from './entities/player-battle-pass.entity';
import {
  CreateBattlePassDto,
  CreateTierDto,
  EarnXpDto,
  ClaimRewardDto,
} from './dto/battle-pass.dto';

export interface TierProgressResult {
  previousTier: number;
  currentTier: number;
  currentXp: number;
  newlyUnlockedTiers: BattlePassTier[];
}

export interface BattlePassAnalytics {
  battlePassId: string;
  season: string;
  totalPlayers: number;
  premiumPlayers: number;
  premiumConversionRate: number;
  averageXpEarned: number;
  averageTierReached: number;
  tierCompletionRates: Array<{ tier: number; completionRate: number }>;
}

@Injectable()
export class BattlePassService {
  private readonly logger = new Logger(BattlePassService.name);

  constructor(
    @InjectRepository(BattlePass)
    private readonly battlePassRepository: Repository<BattlePass>,
    @InjectRepository(BattlePassTier)
    private readonly tierRepository: Repository<BattlePassTier>,
    @InjectRepository(PlayerBattlePass)
    private readonly playerBattlePassRepository: Repository<PlayerBattlePass>,
  ) {}

  // ─── Season Management ─────────────────────────────────────────────────────

  /**
   * Cron: activate/expire battle passes automatically.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSeasonManagement(): Promise<void> {
    this.logger.log('Running battle-pass season management cron');
    const now = new Date();

    // Activate
    const toActivate = await this.battlePassRepository.find({
      where: {
        status: BattlePassStatus.DRAFT,
        startDate: LessThanOrEqual(now),
        endDate: MoreThan(now),
      },
    });
    for (const bp of toActivate) {
      bp.status = BattlePassStatus.ACTIVE;
      await this.battlePassRepository.save(bp);
      this.logger.log(`Activated battle pass season: ${bp.season}`);
    }

    // Expire
    const toExpire = await this.battlePassRepository.find({
      where: { status: BattlePassStatus.ACTIVE },
    });
    for (const bp of toExpire) {
      if (bp.endDate <= now) {
        bp.status = BattlePassStatus.EXPIRED;
        await this.battlePassRepository.save(bp);
        this.logger.log(`Expired battle pass season: ${bp.season}`);
      }
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateBattlePassDto): Promise<BattlePass> {
    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const existing = await this.battlePassRepository.findOne({
      where: { season: dto.season },
    });
    if (existing) {
      throw new BadRequestException(
        `A battle pass for season "${dto.season}" already exists`,
      );
    }

    const battlePass = this.battlePassRepository.create({
      ...dto,
      status: BattlePassStatus.DRAFT,
    });

    return this.battlePassRepository.save(battlePass);
  }

  async findOne(id: string): Promise<BattlePass> {
    const bp = await this.battlePassRepository.findOne({
      where: { id },
      relations: ['tiers'],
    });
    if (!bp) throw new NotFoundException(`Battle pass ${id} not found`);
    return bp;
  }

  async findActive(): Promise<BattlePass[]> {
    return this.battlePassRepository.find({
      where: { status: BattlePassStatus.ACTIVE },
    });
  }

  async findBySeason(season: string): Promise<BattlePass> {
    const bp = await this.battlePassRepository.findOne({
      where: { season },
      relations: ['tiers'],
    });
    if (!bp)
      throw new NotFoundException(`Battle pass for season "${season}" not found`);
    return bp;
  }

  // ─── Tier Management ───────────────────────────────────────────────────────

  async addTier(battlePassId: string, dto: CreateTierDto): Promise<BattlePassTier> {
    await this.findOne(battlePassId);

    const existing = await this.tierRepository.findOne({
      where: { battlePassId, tierNumber: dto.tierNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Tier ${dto.tierNumber} already exists for this battle pass`,
      );
    }

    const tier = this.tierRepository.create({ ...dto, battlePassId });
    return this.tierRepository.save(tier);
  }

  async getTiers(battlePassId: string): Promise<BattlePassTier[]> {
    await this.findOne(battlePassId);
    return this.tierRepository.find({
      where: { battlePassId },
      order: { tierNumber: 'ASC' },
    });
  }

  // ─── Player Progression ────────────────────────────────────────────────────

  /**
   * Get or initialise a player's progress record for a battle pass.
   */
  async getOrCreatePlayerProgress(
    userId: string,
    battlePassId: string,
  ): Promise<PlayerBattlePass> {
    let progress = await this.playerBattlePassRepository.findOne({
      where: { userId, battlePassId },
    });

    if (!progress) {
      await this.findOne(battlePassId); // validate battle pass exists
      progress = this.playerBattlePassRepository.create({
        userId,
        battlePassId,
        isPremium: false,
        currentXp: 0,
        currentTier: 0,
        claimedFreeRewards: [],
        claimedPremiumRewards: [],
      });
      progress = await this.playerBattlePassRepository.save(progress);
    }

    return progress;
  }

  /**
   * Award XP to a player and advance tiers accordingly.
   */
  async earnXp(
    userId: string,
    battlePassId: string,
    dto: EarnXpDto,
  ): Promise<TierProgressResult> {
    const bp = await this.findOne(battlePassId);

    if (bp.status !== BattlePassStatus.ACTIVE) {
      throw new BadRequestException('Battle pass season is not active');
    }

    const progress = await this.getOrCreatePlayerProgress(userId, battlePassId);
    const previousTier = progress.currentTier;

    progress.currentXp += dto.xp;

    const tiers = await this.getTiers(battlePassId);

    // Advance tiers based on cumulative XP
    const newlyUnlockedTiers: BattlePassTier[] = [];
    for (const tier of tiers) {
      if (
        progress.currentXp >= tier.xpRequired &&
        tier.tierNumber > progress.currentTier
      ) {
        progress.currentTier = tier.tierNumber;
        newlyUnlockedTiers.push(tier);
      }
    }

    await this.playerBattlePassRepository.save(progress);

    return {
      previousTier,
      currentTier: progress.currentTier,
      currentXp: progress.currentXp,
      newlyUnlockedTiers,
    };
  }

  // ─── Dual Tracks (Free / Premium) ─────────────────────────────────────────

  /**
   * Purchase the premium track. Grants retroactive premium rewards for all
   * tiers already unlocked by the player.
   */
  async purchasePremium(
    userId: string,
    battlePassId: string,
  ): Promise<PlayerBattlePass> {
    const bp = await this.findOne(battlePassId);

    if (bp.status !== BattlePassStatus.ACTIVE) {
      throw new BadRequestException('Battle pass season is not active');
    }

    const progress = await this.getOrCreatePlayerProgress(userId, battlePassId);

    if (progress.isPremium) {
      throw new BadRequestException('Player already has premium for this season');
    }

    progress.isPremium = true;
    progress.premiumPurchasedAt = new Date();

    // Retroactive: grant all premium rewards for tiers already reached
    const tiers = await this.tierRepository.find({
      where: { battlePassId },
      order: { tierNumber: 'ASC' },
    });

    const retroactiveTiers = tiers.filter(
      (t) =>
        t.tierNumber <= progress.currentTier &&
        t.premiumReward &&
        !progress.claimedPremiumRewards.includes(t.id),
    );

    for (const tier of retroactiveTiers) {
      progress.claimedPremiumRewards.push(tier.id);
    }

    progress.retroactivePurchaseGrantedAt =
      retroactiveTiers.length > 0 ? new Date() : undefined;

    const saved = await this.playerBattlePassRepository.save(progress);

    // Update analytics
    await this.battlePassRepository.increment(
      { id: battlePassId },
      'analytics',
      0, // Workaround – update via raw save
    );
    bp.analytics = {
      ...bp.analytics,
      premiumPurchases: (bp.analytics.premiumPurchases ?? 0) + 1,
      totalPurchases: (bp.analytics.totalPurchases ?? 0) + 1,
    };
    await this.battlePassRepository.save(bp);

    this.logger.log(
      `User ${userId} purchased premium for season ${bp.season}; ` +
        `granted ${retroactiveTiers.length} retroactive rewards`,
    );

    return saved;
  }

  // ─── Reward Claiming ───────────────────────────────────────────────────────

  async claimReward(
    userId: string,
    battlePassId: string,
    dto: ClaimRewardDto,
  ): Promise<{ reward: object }> {
    const progress = await this.getOrCreatePlayerProgress(userId, battlePassId);

    if (dto.tierNumber > progress.currentTier) {
      throw new BadRequestException(
        `Tier ${dto.tierNumber} has not been unlocked yet`,
      );
    }

    if (dto.track === 'premium' && !progress.isPremium) {
      throw new BadRequestException(
        'Premium track requires purchasing the premium battle pass',
      );
    }

    const tier = await this.tierRepository.findOne({
      where: { battlePassId, tierNumber: dto.tierNumber },
    });

    if (!tier) {
      throw new NotFoundException(`Tier ${dto.tierNumber} not found`);
    }

    const claimedList =
      dto.track === 'free'
        ? progress.claimedFreeRewards
        : progress.claimedPremiumRewards;

    if (claimedList.includes(tier.id)) {
      throw new BadRequestException(
        `Reward for tier ${dto.tierNumber} (${dto.track}) already claimed`,
      );
    }

    const reward =
      dto.track === 'free' ? tier.freeReward : tier.premiumReward;

    if (!reward) {
      throw new BadRequestException(
        `No ${dto.track} reward defined for tier ${dto.tierNumber}`,
      );
    }

    claimedList.push(tier.id);
    if (dto.track === 'free') {
      progress.claimedFreeRewards = claimedList;
    } else {
      progress.claimedPremiumRewards = claimedList;
    }

    await this.playerBattlePassRepository.save(progress);
    return { reward };
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────

  async getAnalytics(battlePassId: string): Promise<BattlePassAnalytics> {
    const bp = await this.findOne(battlePassId);
    const allProgress = await this.playerBattlePassRepository.find({
      where: { battlePassId },
    });

    const tiers = await this.getTiers(battlePassId);
    const totalPlayers = allProgress.length;
    const premiumPlayers = allProgress.filter((p) => p.isPremium).length;
    const totalXp = allProgress.reduce((s, p) => s + p.currentXp, 0);
    const totalTier = allProgress.reduce((s, p) => s + p.currentTier, 0);

    const tierCompletionRates = tiers.map((t) => ({
      tier: t.tierNumber,
      completionRate: totalPlayers
        ? allProgress.filter((p) => p.currentTier >= t.tierNumber).length /
          totalPlayers
        : 0,
    }));

    return {
      battlePassId,
      season: bp.season,
      totalPlayers,
      premiumPlayers,
      premiumConversionRate: totalPlayers ? premiumPlayers / totalPlayers : 0,
      averageXpEarned: totalPlayers ? totalXp / totalPlayers : 0,
      averageTierReached: totalPlayers ? totalTier / totalPlayers : 0,
      tierCompletionRates,
    };
  }
}
