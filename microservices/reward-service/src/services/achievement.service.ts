import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { RewardService } from './reward.service';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepository: Repository<UserAchievement>,
    private readonly rewardService: RewardService,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────
  async createAchievement(
    achievementData: Partial<Achievement>,
  ): Promise<Achievement> {
    const achievement = this.achievementRepository.create({
      ...achievementData,
    });
    return this.achievementRepository.save(achievement);
  }

  async getAchievementById(id: string): Promise<Achievement> {
    const a = await this.achievementRepository.findOne({ where: { id } });
    if (!a) throw new NotFoundException(`Achievement ${id} not found`);
    return a;
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', createdAt: 'DESC' },
    });
  }

  // ─── User Achievements ───────────────────────────────────────────────────────
  async getUserAchievements(
    userId: string,
  ): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const records = await this.userAchievementRepository.find({
      where: { userId },
      relations: ['achievement'],
      order: { unlockedAt: 'DESC' },
    });

    return records as (UserAchievement & { achievement: Achievement })[];
  }

  /**
   * Unlock an achievement for a user.
   * Idempotent — repeated calls for an already-unlocked achievement return
   * the existing record without re-distributing rewards.
   */
  async unlockAchievement(
    userId: string,
    achievementId: string,
  ): Promise<UserAchievement> {
    const achievement = await this.achievementRepository.findOne({
      where: { id: achievementId, isActive: true },
    });

    if (!achievement) {
      throw new NotFoundException(
        `Achievement ${achievementId} not found or inactive`,
      );
    }

    // Idempotency check
    let userAchievement = await this.userAchievementRepository.findOne({
      where: { userId, achievementId },
    });

    if (userAchievement?.isUnlocked) {
      return userAchievement;
    }

    if (userAchievement) {
      userAchievement.isUnlocked = true;
      userAchievement.unlockedAt = new Date();
      userAchievement.progress = 100;
    } else {
      userAchievement = this.userAchievementRepository.create({
        userId,
        achievementId,
        isUnlocked: true,
        unlockedAt: new Date(),
        progress: 100,
      });
    }

    const saved = await this.userAchievementRepository.save(userAchievement);

    // Bump aggregate unlock count on the achievement row
    await this.achievementRepository
      .createQueryBuilder()
      .update(Achievement)
      .set({ unlockedCount: () => '"unlockedCount" + 1' })
      .where('id = :id', { id: achievementId })
      .execute();

    // Distribute token reward if the achievement has points value
    if (achievement.points > 0) {
      await this.rewardService.distributeTokenReward(
        userId,
        achievement.points,
        `Achievement unlocked: ${achievement.name}`,
      );
    }

    this.logger.log(
      `Achievement "${achievement.name}" unlocked for user ${userId}`,
    );

    return saved;
  }

  /**
   * Evaluate all active achievements against activityData and unlock any
   * whose conditions are met.
   */
  async checkAndUnlockAchievements(
    userId: string,
    activityData: Record<string, any>,
  ): Promise<UserAchievement[]> {
    const unlocked: UserAchievement[] = [];

    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
    });

    for (const achievement of achievements) {
      const existing = await this.userAchievementRepository.findOne({
        where: { userId, achievementId: achievement.id },
      });

      if (existing?.isUnlocked) continue;

      if (this.meetsConditions(achievement, activityData)) {
        unlocked.push(await this.unlockAchievement(userId, achievement.id));
      }
    }

    return unlocked;
  }

  /**
   * Entry point called from game events. Wraps checkAndUnlockAchievements
   * with a normalised activityData shape.
   */
  async updateUserProgress(
    userId: string,
    activityType: string,
    data: Record<string, any>,
  ): Promise<UserAchievement[]> {
    return this.checkAndUnlockAchievements(userId, {
      type: activityType,
      ...data,
      userId,
      timestamp: new Date(),
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────
  private meetsConditions(
    achievement: Achievement,
    activityData: Record<string, any>,
  ): boolean {
    const conditions = achievement.unlockConditions;

    if (!conditions) return false;

    switch (conditions.type) {
      case 'puzzle_solved':
        return (
          typeof conditions.count === 'number' &&
          (activityData.puzzleCount ?? 0) >= conditions.count
        );

      case 'streak':
        return (
          typeof conditions.days === 'number' &&
          (activityData.streakDays ?? 0) >= conditions.days
        );

      case 'score_reached':
        return (
          typeof conditions.threshold === 'number' &&
          (activityData.score ?? 0) >= conditions.threshold
        );

      case 'nft_minted':
        return (
          typeof conditions.count === 'number' &&
          (activityData.nftCount ?? 0) >= conditions.count
        );

      default:
        return false;
    }
  }
}
