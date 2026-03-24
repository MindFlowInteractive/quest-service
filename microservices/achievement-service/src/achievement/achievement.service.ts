import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { QueryHistoryDto } from './dto/query-history.dto';
import { TrackProgressDto } from './dto/track-progress.dto';
import { AchievementHistoryType, AchievementRarity } from './achievement.types';
import { Achievement } from './entities/achievement.entity';
import { AchievementHistory } from './entities/achievement-history.entity';
import { AchievementProgress } from './entities/achievement-progress.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import {
  AchievementNotificationService,
  UnlockNotificationPayload,
} from './achievement-notification.service';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(AchievementProgress)
    private readonly progressRepo: Repository<AchievementProgress>,
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(AchievementHistory)
    private readonly historyRepo: Repository<AchievementHistory>,
    private readonly notificationService: AchievementNotificationService,
  ) {}

  async createDefinition(dto: CreateAchievementDto): Promise<Achievement> {
    const existing = await this.achievementRepo.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Achievement definition with code '${dto.code}' already exists`,
      );
    }

    const achievement = this.achievementRepo.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      metricKey: dto.metricKey,
      targetValue: dto.targetValue,
      conditionType: dto.conditionType,
      rarity: dto.rarity,
      metadata: dto.metadata,
      isActive: dto.isActive ?? true,
    });

    const savedAchievement = await this.achievementRepo.save(achievement);

    if (dto.badge) {
      const badge = this.badgeRepo.create({
        achievementId: savedAchievement.id,
        name: dto.badge.name,
        description: dto.badge.description,
        iconUrl: dto.badge.iconUrl,
      });
      await this.badgeRepo.save(badge);
    }

    const fullAchievement = await this.achievementRepo.findOne({
      where: { id: savedAchievement.id },
      relations: ['badge'],
    });

    if (!fullAchievement) {
      throw new NotFoundException('Achievement was created but could not be loaded');
    }

    return fullAchievement;
  }

  async seedDefaultDefinitions() {
    const defaults: CreateAchievementDto[] = [
      {
        code: 'FIRST_WIN',
        name: 'First Victory',
        description: 'Win your first challenge',
        metricKey: 'wins',
        targetValue: 1,
        rarity: AchievementRarity.COMMON,
        badge: {
          name: 'First Victory Badge',
          description: 'Awarded for your first win',
        },
      },
      {
        code: 'HUNDRED_PUZZLES',
        name: 'Puzzle Veteran',
        description: 'Complete 100 puzzles',
        metricKey: 'puzzles_completed',
        targetValue: 100,
        rarity: AchievementRarity.RARE,
        badge: {
          name: 'Veteran Badge',
          description: 'Awarded for completing 100 puzzles',
        },
      },
      {
        code: 'SEVEN_DAY_STREAK',
        name: 'Consistency Master',
        description: 'Maintain a 7-day activity streak',
        metricKey: 'daily_streak',
        targetValue: 7,
        rarity: AchievementRarity.EPIC,
        badge: {
          name: 'Consistency Badge',
          description: 'Awarded for a 7-day streak',
        },
      },
    ];

    let created = 0;
    for (const definition of defaults) {
      const exists = await this.achievementRepo.findOne({
        where: { code: definition.code },
      });
      if (exists) {
        continue;
      }
      await this.createDefinition(definition);
      created += 1;
    }

    return {
      seeded: defaults.length,
      created,
      skipped: defaults.length - created,
    };
  }

  async listDefinitions(): Promise<Achievement[]> {
    return this.achievementRepo.find({
      relations: ['badge'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getDefinition(id: string): Promise<Achievement> {
    const achievement = await this.achievementRepo.findOne({
      where: { id },
      relations: ['badge'],
    });

    if (!achievement) {
      throw new NotFoundException(`Achievement '${id}' not found`);
    }

    return achievement;
  }

  async trackProgress(dto: TrackProgressDto) {
    const incrementBy = dto.amount ?? 1;

    const achievements = await this.achievementRepo.find({
      where: {
        metricKey: dto.metricKey,
        isActive: true,
      },
      relations: ['badge'],
    });

    if (achievements.length === 0) {
      return {
        updated: 0,
        unlocked: [],
        badgesAwarded: [],
        message: `No active achievements configured for metric '${dto.metricKey}'`,
      };
    }

    const unlocked: Array<{ achievementId: string; code: string; name: string }> = [];
    const badgesAwarded: Array<{ badgeId: string; name: string }> = [];

    for (const achievement of achievements) {
      let progress = await this.progressRepo.findOne({
        where: {
          userId: dto.userId,
          achievementId: achievement.id,
        },
      });

      if (!progress) {
        progress = this.progressRepo.create({
          userId: dto.userId,
          achievementId: achievement.id,
          currentValue: 0,
        });
      }

      progress.currentValue += incrementBy;
      progress.lastEvaluatedAt = new Date();

      await this.progressRepo.save(progress);

      await this.appendHistory({
        userId: dto.userId,
        achievementId: achievement.id,
        type: AchievementHistoryType.PROGRESS_UPDATED,
        payload: {
          metricKey: dto.metricKey,
          incrementBy,
          currentValue: progress.currentValue,
          targetValue: achievement.targetValue,
          context: dto.context,
        },
      });

      const shouldUnlock =
        !progress.unlockedAt && progress.currentValue >= achievement.targetValue;

      if (!shouldUnlock) {
        continue;
      }

      progress.unlockedAt = new Date();
      await this.progressRepo.save(progress);

      unlocked.push({
        achievementId: achievement.id,
        code: achievement.code,
        name: achievement.name,
      });

      await this.appendHistory({
        userId: dto.userId,
        achievementId: achievement.id,
        type: AchievementHistoryType.ACHIEVEMENT_UNLOCKED,
        payload: {
          code: achievement.code,
          unlockedAt: progress.unlockedAt.toISOString(),
          rarity: achievement.rarity,
        },
      });

      if (achievement.badge) {
        const existingUserBadge = await this.userBadgeRepo.findOne({
          where: {
            userId: dto.userId,
            badgeId: achievement.badge.id,
          },
        });

        if (!existingUserBadge) {
          const userBadge = this.userBadgeRepo.create({
            userId: dto.userId,
            badgeId: achievement.badge.id,
            achievementId: achievement.id,
          });

          await this.userBadgeRepo.save(userBadge);
          badgesAwarded.push({
            badgeId: achievement.badge.id,
            name: achievement.badge.name,
          });

          await this.appendHistory({
            userId: dto.userId,
            achievementId: achievement.id,
            type: AchievementHistoryType.BADGE_AWARDED,
            payload: {
              badgeId: achievement.badge.id,
              badgeName: achievement.badge.name,
            },
          });
        }
      }

      const notificationPayload: UnlockNotificationPayload = {
        userId: dto.userId,
        achievementCode: achievement.code,
        achievementName: achievement.name,
        rarity: achievement.rarity,
        badgeName: achievement.badge?.name,
        unlockedAt: progress.unlockedAt.toISOString(),
      };

      const notificationResult = await this.notificationService.sendUnlockNotification(
        notificationPayload,
      );

      await this.appendHistory({
        userId: dto.userId,
        achievementId: achievement.id,
        type: AchievementHistoryType.NOTIFICATION_SENT,
        payload: {
          ...notificationPayload,
          notification: notificationResult,
        },
      });
    }

    return {
      updated: achievements.length,
      unlocked,
      badgesAwarded,
    };
  }

  async getUserProgress(userId: string) {
    return this.progressRepo.find({
      where: { userId },
      relations: ['achievement', 'achievement.badge'],
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async getUserHistory(userId: string, query: QueryHistoryDto) {
    return this.historyRepo.find({
      where: { userId },
      relations: ['achievement'],
      order: {
        createdAt: 'DESC',
      },
      take: query.limit ?? 50,
    });
  }

  async getUserBadges(userId: string) {
    return this.userBadgeRepo.find({
      where: { userId },
      relations: ['badge', 'achievement'],
      order: {
        awardedAt: 'DESC',
      },
    });
  }

  private async appendHistory(input: {
    userId: string;
    achievementId: string;
    type: AchievementHistoryType;
    payload?: Record<string, unknown>;
  }) {
    const history = this.historyRepo.create(input);
    await this.historyRepo.save(history);
  }
}
