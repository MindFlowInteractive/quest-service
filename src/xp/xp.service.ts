import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import levelConfig from './config/level-config.json';
import { AwardXpDto } from './dto/award-xp.dto';
import { PlayerLevel } from './entities/player-level.entity';
import { XpAward } from './entities/xp-award.entity';
import { PrivacySettings } from '../privacy/entities/privacy-settings.entity';
import { UserStreak } from '../users/entities/user-streak.entity';
import { User } from '../users/entities/user.entity';
import {
  AwardXpResult,
  LevelConfig,
  LevelProgressView,
  StreakMilestoneReward,
} from './xp.types';
import { PLAYER_LEVEL_UP_EVENT, XpAwardReason } from './xp.constants';

@Injectable()
export class XpService {
  private readonly logger = new Logger(XpService.name);
  private readonly config: LevelConfig = levelConfig as LevelConfig;

  constructor(
    @InjectRepository(PlayerLevel)
    private readonly playerLevelRepo: Repository<PlayerLevel>,
    @InjectRepository(XpAward)
    private readonly xpAwardRepo: Repository<XpAward>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserStreak)
    private readonly userStreakRepo: Repository<UserStreak>,
    @InjectRepository(PrivacySettings)
    private readonly privacySettingsRepo: Repository<PrivacySettings>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getMyLevel(userId: string): Promise<LevelProgressView> {
    await this.assertUserExists(userId);
    const level = await this.getOrCreatePlayerLevel(userId);
    return this.toLevelView(level);
  }

  async getPublicLevel(userId: string): Promise<LevelProgressView> {
    const user = await this.assertUserExists(userId);
    const privacySettings = await this.privacySettingsRepo.findOne({
      where: { userId },
    });

    if (privacySettings && !privacySettings.profilePublic) {
      throw new ForbiddenException('Player level is private');
    }

    if (user.preferences?.privacy?.showStats === false) {
      throw new ForbiddenException('Player level is private');
    }

    const level = await this.playerLevelRepo.findOne({ where: { userId } });
    return this.toLevelView(level ?? this.playerLevelRepo.create(this.getDefaultLevelData(userId)));
  }

  async awardXp(dto: AwardXpDto): Promise<AwardXpResult> {
    await this.assertUserExists(dto.userId);

    const existingAward = await this.xpAwardRepo.findOne({
      where: { userId: dto.userId, sourceEventId: dto.sourceEventId },
    });

    if (existingAward) {
      const level = await this.getOrCreatePlayerLevel(dto.userId);
      return {
        awarded: false,
        duplicate: true,
        award: existingAward,
        level: this.toLevelView(level),
      };
    }

    let levelUpPayload: { userId: string; oldLevel: number; newLevel: number; totalXP: number } | null = null;

    const result = await this.dataSource.transaction(async (manager) => {
      const playerLevelRepository = manager.getRepository(PlayerLevel);
      const xpAwardRepository = manager.getRepository(XpAward);
      const userRepository = manager.getRepository(User);

      const doubleCheckAward = await xpAwardRepository.findOne({
        where: { userId: dto.userId, sourceEventId: dto.sourceEventId },
      });

      if (doubleCheckAward) {
        const currentLevel = await this.findOrCreateLevelInManager(playerLevelRepository, dto.userId);
        return {
          awarded: false,
          duplicate: true,
          award: doubleCheckAward,
          level: currentLevel,
        };
      }

      const currentLevel = await this.findOrCreateLevelInManager(playerLevelRepository, dto.userId);
      const oldLevel = currentLevel.level;

      const award = xpAwardRepository.create({
        userId: dto.userId,
        sourceEventId: dto.sourceEventId,
        reason: dto.reason,
        amount: dto.amount,
        metadata: dto.metadata ?? {},
      });
      await xpAwardRepository.save(award);

      currentLevel.xp += dto.amount;
      const resolvedLevel = this.resolveLevel(currentLevel.xp);
      currentLevel.level = resolvedLevel.level;
      currentLevel.xpToNextLevel = resolvedLevel.xpToNextLevel;
      const savedLevel = await playerLevelRepository.save(currentLevel);

      await userRepository.update(
        { id: dto.userId },
        {
          experience: savedLevel.xp,
          level: savedLevel.level,
        },
      );

      if (savedLevel.level > oldLevel) {
        levelUpPayload = {
          userId: dto.userId,
          oldLevel,
          newLevel: savedLevel.level,
          totalXP: savedLevel.xp,
        };
      }

      return {
        awarded: true,
        duplicate: false,
        award,
        level: savedLevel,
      };
    });

    if (levelUpPayload) {
      this.eventEmitter.emit(PLAYER_LEVEL_UP_EVENT, levelUpPayload);
    }

    return {
      awarded: result.awarded,
      duplicate: result.duplicate,
      award: result.award,
      level: this.toLevelView(result.level),
    };
  }

  async awardPuzzleCompletionXp(params: {
    userId: string;
    puzzleId: string;
    difficulty: string;
    hintsUsed: number;
    sourceEventId: string;
    solvedAt?: Date;
  }): Promise<LevelProgressView> {
    const solvedAt = params.solvedAt ?? new Date();
    const baseSourceEventId = `${params.sourceEventId}:base`;

    const existingBaseAward = await this.xpAwardRepo.findOne({
      where: { userId: params.userId, sourceEventId: baseSourceEventId },
    });

    if (existingBaseAward) {
      return this.getMyLevel(params.userId);
    }

    const difficultyXp =
      this.config.xpAwards.puzzleSolvedByDifficulty[params.difficulty] ??
      this.config.xpAwards.puzzleSolvedByDifficulty.medium;

    await this.awardXp({
      userId: params.userId,
      amount: difficultyXp,
      reason: XpAwardReason.PUZZLE_SOLVED,
      sourceEventId: baseSourceEventId,
      metadata: {
        puzzleId: params.puzzleId,
        difficulty: params.difficulty,
      },
    });

    if (params.hintsUsed === 0) {
      await this.awardXp({
        userId: params.userId,
        amount: this.config.xpAwards.noHintsBonus,
        reason: XpAwardReason.NO_HINTS_USED,
        sourceEventId: `${params.sourceEventId}:no-hints`,
        metadata: {
          puzzleId: params.puzzleId,
        },
      });
    }

    if (await this.isFirstDailySolve(params.userId, solvedAt)) {
      await this.awardXp({
        userId: params.userId,
        amount: this.config.xpAwards.firstDailySolveBonus,
        reason: XpAwardReason.FIRST_DAILY_SOLVE,
        sourceEventId: `${params.userId}:${this.getUtcDateKey(solvedAt)}:first-daily-solve`,
        metadata: {
          puzzleId: params.puzzleId,
          awardedForDate: this.getUtcDateKey(solvedAt),
        },
      });
    }

    const streak = await this.advanceStreak(params.userId, solvedAt);
    const milestone = this.findStreakMilestone(streak.currentStreak);
    if (milestone) {
      await this.awardXp({
        userId: params.userId,
        amount: milestone.xp,
        reason: XpAwardReason.STREAK_MILESTONE,
        sourceEventId: `${params.userId}:streak:${milestone.streak}`,
        metadata: {
          streak: milestone.streak,
          puzzleId: params.puzzleId,
        },
      });
    }

    return this.getMyLevel(params.userId);
  }

  private async assertUserExists(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async getOrCreatePlayerLevel(userId: string): Promise<PlayerLevel> {
    let playerLevel = await this.playerLevelRepo.findOne({ where: { userId } });
    if (!playerLevel) {
      playerLevel = this.playerLevelRepo.create(this.getDefaultLevelData(userId));
      playerLevel = await this.playerLevelRepo.save(playerLevel);
    }
    return playerLevel;
  }

  private async findOrCreateLevelInManager(
    repo: Repository<PlayerLevel>,
    userId: string,
  ): Promise<PlayerLevel> {
    let playerLevel = await repo.findOne({ where: { userId } });
    if (!playerLevel) {
      playerLevel = repo.create(this.getDefaultLevelData(userId));
      playerLevel = await repo.save(playerLevel);
    }
    return playerLevel;
  }

  private getDefaultLevelData(userId: string): Partial<PlayerLevel> {
    return {
      userId,
      xp: 0,
      level: 1,
      xpToNextLevel: this.resolveLevel(0).xpToNextLevel,
    };
  }

  private resolveLevel(xp: number): { level: number; xpToNextLevel: number; minXp: number; nextMinXp: number | null } {
    const thresholds = [...this.config.levels].sort((a, b) => a.minXp - b.minXp);
    let currentThreshold = thresholds[0];
    let nextThreshold: typeof thresholds[number] | null = null;

    for (let i = 0; i < thresholds.length; i += 1) {
      const threshold = thresholds[i];
      if (xp >= threshold.minXp) {
        currentThreshold = threshold;
        nextThreshold = thresholds[i + 1] ?? null;
      } else {
        break;
      }
    }

    return {
      level: currentThreshold.level,
      xpToNextLevel: nextThreshold ? Math.max(nextThreshold.minXp - xp, 0) : 0,
      minXp: currentThreshold.minXp,
      nextMinXp: nextThreshold?.minXp ?? null,
    };
  }

  private toLevelView(level: PlayerLevel): LevelProgressView {
    const resolved = this.resolveLevel(level.xp);
    const currentSpan = resolved.nextMinXp ? resolved.nextMinXp - resolved.minXp : 0;
    const earnedWithinLevel = level.xp - resolved.minXp;
    const progressPercentage =
      currentSpan > 0 ? Math.min(100, Math.round((earnedWithinLevel / currentSpan) * 100)) : 100;

    return {
      userId: level.userId,
      xp: level.xp,
      level: level.level,
      xpToNextLevel: level.xpToNextLevel,
      progressPercentage,
    };
  }

  private async isFirstDailySolve(userId: string, solvedAt: Date): Promise<boolean> {
    const dayStart = new Date(solvedAt);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const awardsToday = await this.xpAwardRepo.count({
      where: {
        userId,
        reason: XpAwardReason.FIRST_DAILY_SOLVE,
        createdAt: Between(dayStart, dayEnd),
      },
    });

    return awardsToday === 0;
  }

  private async advanceStreak(userId: string, solvedAt: Date): Promise<UserStreak> {
    let streak = await this.userStreakRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!streak) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      streak = this.userStreakRepo.create({
        user,
        currentStreak: 1,
        streakStartDate: solvedAt,
        lastPuzzleCompletedAt: solvedAt,
      });
      return this.userStreakRepo.save(streak);
    }

    const todayStart = this.getUtcDayStart(solvedAt);
    const lastCompletion = streak.lastPuzzleCompletedAt
      ? new Date(streak.lastPuzzleCompletedAt)
      : null;

    if (!lastCompletion) {
      streak.currentStreak = 1;
      streak.streakStartDate = solvedAt;
    } else {
      const lastCompletionStart = this.getUtcDayStart(lastCompletion);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

      if (lastCompletionStart.getTime() === todayStart.getTime()) {
        streak.lastPuzzleCompletedAt = solvedAt;
        return this.userStreakRepo.save(streak);
      }

      if (lastCompletionStart.getTime() === yesterdayStart.getTime()) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
        streak.streakStartDate = solvedAt;
      }
    }

    streak.lastPuzzleCompletedAt = solvedAt;
    return this.userStreakRepo.save(streak);
  }

  private findStreakMilestone(currentStreak: number): StreakMilestoneReward | undefined {
    return this.config.xpAwards.streakMilestones.find(
      (milestone) => milestone.streak === currentStreak,
    );
  }

  private getUtcDayStart(date: Date): Date {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    return dayStart;
  }

  private getUtcDateKey(date: Date): string {
    return this.getUtcDayStart(date).toISOString().slice(0, 10);
  }
}
