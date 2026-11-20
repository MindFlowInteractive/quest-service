import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PLAYER_LEVEL_UP_EVENT } from '../xp/xp.constants';
import { CosmeticItem } from './entities/cosmetic-item.entity';
import { PlayerCosmeticUnlock } from './entities/player-cosmetic-unlock.entity';
import { PlayerEquippedCosmetic } from './entities/player-equipped-cosmetic.entity';
import {
  CosmeticType,
  PlayerMilestoneStats,
  UnlockCondition,
  UnlockConditionType,
} from './cosmetics.types';
import {
  CosmeticView,
  CreateCosmeticDto,
  PlayerCosmeticView,
  ProfileCosmeticsView,
  UpdateCosmeticDto,
} from './dto/cosmetics.dto';

const NUMERIC_CONDITIONS: Record<string, keyof PlayerMilestoneStats> = {
  [UnlockConditionType.LEVEL]: 'level',
  [UnlockConditionType.TOTAL_XP]: 'totalXp',
  [UnlockConditionType.PUZZLES_SOLVED]: 'puzzlesSolved',
  [UnlockConditionType.STREAK_DAYS]: 'streakDays',
};

/**
 * True when the player's stats satisfy the condition. A stat the caller did
 * not send counts as not reached, and MANUAL items never unlock here.
 */
export function isConditionMet(
  condition: UnlockCondition,
  stats: PlayerMilestoneStats,
): boolean {
  if (condition.type === UnlockConditionType.ACHIEVEMENT) {
    return (
      !!condition.achievementId &&
      (stats.achievementIds ?? []).includes(condition.achievementId)
    );
  }

  const statKey = NUMERIC_CONDITIONS[condition.type];
  if (!statKey || condition.threshold === undefined) return false;

  const value = stats[statKey];
  return typeof value === 'number' && value >= condition.threshold;
}

/** Rejects conditions that could never be evaluated. */
export function validateCondition(condition: UnlockCondition): void {
  if (condition.type === UnlockConditionType.ACHIEVEMENT) {
    if (!condition.achievementId) {
      throw new BadRequestException(
        'achievement conditions need an achievementId',
      );
    }
    return;
  }
  if (
    NUMERIC_CONDITIONS[condition.type] &&
    (condition.threshold === undefined || condition.threshold < 1)
  ) {
    throw new BadRequestException(
      `${condition.type} conditions need a threshold of at least 1`,
    );
  }
}

function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; driverError?: { code?: string } };
  return err?.code === '23505' || err?.driverError?.code === '23505';
}

@Injectable()
export class CosmeticsService {
  private readonly logger = new Logger(CosmeticsService.name);

  constructor(
    @InjectRepository(CosmeticItem)
    private readonly itemRepo: Repository<CosmeticItem>,

    @InjectRepository(PlayerCosmeticUnlock)
    private readonly unlockRepo: Repository<PlayerCosmeticUnlock>,

    @InjectRepository(PlayerEquippedCosmetic)
    private readonly equippedRepo: Repository<PlayerEquippedCosmetic>,
  ) {}

  // ─── Catalog ──────────────────────────────────────────────────────────────

  async createCosmetic(dto: CreateCosmeticDto): Promise<CosmeticItem> {
    validateCondition(dto.unlockCondition);

    const existing = await this.itemRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(
        `Cosmetic with slug "${dto.slug}" already exists`,
      );
    }

    const item = this.itemRepo.create({
      slug: dto.slug,
      type: dto.type,
      name: dto.name,
      description: dto.description ?? null,
      displayText:
        dto.displayText ?? (dto.type === CosmeticType.TITLE ? dto.name : null),
      metadata: dto.metadata ?? {},
      rarity: dto.rarity ?? 'common',
      unlockCondition: { ...dto.unlockCondition },
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.itemRepo.save(item);
  }

  async updateCosmetic(
    cosmeticId: string,
    dto: UpdateCosmeticDto,
  ): Promise<CosmeticItem> {
    const item = await this.findItemOrThrow(cosmeticId);

    if (dto.unlockCondition !== undefined) {
      validateCondition(dto.unlockCondition);
      item.unlockCondition = { ...dto.unlockCondition };
    }
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.displayText !== undefined) item.displayText = dto.displayText;
    if (dto.metadata !== undefined) item.metadata = dto.metadata;
    if (dto.rarity !== undefined) item.rarity = dto.rarity;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) item.sortOrder = dto.sortOrder;

    return this.itemRepo.save(item);
  }

  async listCatalog(type?: CosmeticType): Promise<CosmeticView[]> {
    const items = await this.itemRepo.find({
      where: type ? { isActive: true, type } : { isActive: true },
      order: { type: 'ASC', sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return items.map((item) => this.toView(item));
  }

  async findItemOrThrow(cosmeticId: string): Promise<CosmeticItem> {
    const item = await this.itemRepo.findOne({ where: { id: cosmeticId } });
    if (!item) {
      throw new NotFoundException(`Cosmetic "${cosmeticId}" not found`);
    }
    return item;
  }

  // ─── Unlocking ────────────────────────────────────────────────────────────

  /**
   * Unlocks every active item whose condition the stats now satisfy and that
   * the player does not own yet. Returns only the newly unlocked items.
   */
  async evaluateUnlocks(
    userId: string,
    stats: PlayerMilestoneStats,
  ): Promise<CosmeticItem[]> {
    const [items, owned] = await Promise.all([
      this.itemRepo.find({ where: { isActive: true } }),
      this.unlockRepo.find({ where: { userId } }),
    ]);
    const ownedIds = new Set(owned.map((u) => u.cosmeticId));

    const unlocked: CosmeticItem[] = [];
    for (const item of items) {
      if (ownedIds.has(item.id)) continue;
      if (!isConditionMet(item.unlockCondition, stats)) continue;

      if (await this.saveUnlock(userId, item.id, 'milestone')) {
        unlocked.push(item);
      }
    }

    if (unlocked.length > 0) {
      this.logger.log(
        `Unlocked ${unlocked.length} cosmetic(s) for user ${userId}: ${unlocked
          .map((i) => i.slug)
          .join(', ')}`,
      );
    }
    return unlocked;
  }

  /** Re-checks level and XP based unlocks whenever a player levels up. */
  @OnEvent(PLAYER_LEVEL_UP_EVENT)
  async handlePlayerLevelUp(payload: {
    userId: string;
    newLevel: number;
    totalXP: number;
  }): Promise<void> {
    await this.evaluateUnlocks(payload.userId, {
      level: payload.newLevel,
      totalXp: payload.totalXP,
    });
  }

  /** Gives a player an item directly. Calling it twice is safe. */
  async grantCosmetic(
    userId: string,
    cosmeticId: string,
    source = 'grant',
  ): Promise<PlayerCosmeticUnlock> {
    await this.findItemOrThrow(cosmeticId);

    const existing = await this.unlockRepo.findOne({
      where: { userId, cosmeticId },
    });
    if (existing) return existing;

    await this.saveUnlock(userId, cosmeticId, source);
    const saved = await this.unlockRepo.findOne({
      where: { userId, cosmeticId },
    });
    if (!saved) {
      throw new NotFoundException(`Unlock for "${cosmeticId}" was not saved`);
    }
    return saved;
  }

  /** Inserts an unlock; returns false if another request already did. */
  private async saveUnlock(
    userId: string,
    cosmeticId: string,
    source: string,
  ): Promise<boolean> {
    try {
      await this.unlockRepo.save(
        this.unlockRepo.create({ userId, cosmeticId, source }),
      );
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  // ─── Owned items and equipping ────────────────────────────────────────────

  async listOwned(userId: string): Promise<PlayerCosmeticView[]> {
    const unlocks = await this.unlockRepo.find({
      where: { userId },
      order: { unlockedAt: 'ASC' },
    });
    if (unlocks.length === 0) return [];

    const [items, equipped] = await Promise.all([
      this.itemRepo.find({
        where: { id: In(unlocks.map((u) => u.cosmeticId)), isActive: true },
      }),
      this.equippedRepo.find({ where: { userId } }),
    ]);
    const itemsById = new Map(items.map((i) => [i.id, i]));
    const equippedIds = new Set(equipped.map((e) => e.cosmeticId));

    const result: PlayerCosmeticView[] = [];
    for (const unlock of unlocks) {
      const item = itemsById.get(unlock.cosmeticId);
      if (!item) continue;
      result.push({
        ...this.toView(item),
        unlockedAt: unlock.unlockedAt,
        equipped: equippedIds.has(item.id),
      });
    }
    return result;
  }

  /** Puts an owned item in its slot, replacing whatever was there. */
  async equip(userId: string, cosmeticId: string): Promise<CosmeticView> {
    const item = await this.findItemOrThrow(cosmeticId);
    if (!item.isActive) {
      throw new NotFoundException(`Cosmetic "${cosmeticId}" not found`);
    }

    const owned = await this.unlockRepo.count({
      where: { userId, cosmeticId },
    });
    if (owned === 0) {
      throw new ForbiddenException(
        `Cosmetic "${item.slug}" has not been unlocked by this player`,
      );
    }

    const current = await this.equippedRepo.findOne({
      where: { userId, slot: item.type },
    });
    if (current) {
      current.cosmeticId = item.id;
      await this.equippedRepo.save(current);
    } else {
      await this.equippedRepo.save(
        this.equippedRepo.create({
          userId,
          slot: item.type,
          cosmeticId: item.id,
        }),
      );
    }
    return this.toView(item);
  }

  /** Empties a slot. Returns whether anything was equipped there. */
  async unequip(
    userId: string,
    slot: CosmeticType,
  ): Promise<{ unequipped: boolean }> {
    const result = await this.equippedRepo.delete({ userId, slot });
    return { unequipped: (result.affected ?? 0) > 0 };
  }

  // ─── Profile display ──────────────────────────────────────────────────────

  /** The equipped title and cosmetics a profile should show. */
  async getProfileDisplay(userId: string): Promise<ProfileCosmeticsView> {
    const equipped = await this.equippedRepo.find({ where: { userId } });
    const view: ProfileCosmeticsView = { userId, title: null, equipped: {} };
    if (equipped.length === 0) return view;

    const items = await this.itemRepo.find({
      where: { id: In(equipped.map((e) => e.cosmeticId)), isActive: true },
    });
    const itemsById = new Map(items.map((i) => [i.id, i]));

    for (const row of equipped) {
      const item = itemsById.get(row.cosmeticId);
      if (!item || item.type !== row.slot) continue;
      view.equipped[row.slot] = this.toView(item);
    }
    view.title = view.equipped[CosmeticType.TITLE] ?? null;
    return view;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  toView(item: CosmeticItem): CosmeticView {
    return {
      id: item.id,
      slug: item.slug,
      type: item.type,
      name: item.name,
      description: item.description,
      displayText: item.displayText,
      metadata: item.metadata ?? {},
      rarity: item.rarity,
    };
  }
}
