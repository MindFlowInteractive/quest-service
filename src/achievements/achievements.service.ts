
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { NotificationService } from '../notifications/notification.service';
import { AchievementConditionEngine } from './achievement-condition.engine';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    private readonly notificationService: NotificationService,
    private readonly conditionEngine: AchievementConditionEngine,
  ) {}

  async create(createAchievementDto: CreateAchievementDto) {
    const achievement = this.achievementRepository.create(createAchievementDto);
    return this.achievementRepository.save(achievement);
  }

  async findAll() {
    return this.achievementRepository.find();
  }

  async findOne(id: string) {
    return this.achievementRepository.findOne({ where: { id } });
  }

  async update(id: string, updateAchievementDto: UpdateAchievementDto) {
    await this.achievementRepository.update(id, updateAchievementDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.achievementRepository.delete(id);
    return { deleted: true };
  }

  // Unlock achievement for user if conditions met
  async tryUnlockAchievement(userId: string, achievementId: string, userContext: any) {
    const achievement = await this.achievementRepository.findOne({ where: { id: achievementId } });
    if (!achievement) return null;
    const userAchievement = await this.userAchievementRepository.findOne({ where: { userId, achievementId } });
    if (userAchievement?.isUnlocked) return userAchievement;
    const isUnlocked = await this.conditionEngine.evaluate(userId, achievement, userContext);
    if (isUnlocked) {
      const unlocked = await this.userAchievementRepository.save({
        userId,
        achievementId,
        isUnlocked: true,
        unlockedAt: new Date(),
        progress: 100,
        progressTotal: 100,
      });
      await this.notificationService.notifyAchievementUnlocked(userId, {
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        celebrationMessage: achievement.metadata?.celebrationMessage,
      });
      // Optionally update analytics, unlock content, etc.
      return unlocked;
    }
    return null;
  }

  // Track progress for incremental achievements
  async updateProgress(userId: string, achievementId: string, progressDelta: number, context: any = {}) {
    const achievement = await this.achievementRepository.findOne({ where: { id: achievementId } });
    if (!achievement) return null;
    let userAchievement = await this.userAchievementRepository.findOne({ where: { userId, achievementId } });
    if (!userAchievement) {
      userAchievement = this.userAchievementRepository.create({
        userId,
        achievementId,
        progress: 0,
        progressTotal: 100,
        isUnlocked: false,
      });
    }
    userAchievement.progress += progressDelta;
    if (userAchievement.progress >= userAchievement.progressTotal) {
      userAchievement.isUnlocked = true;
      userAchievement.unlockedAt = new Date();
      await this.notificationService.notifyAchievementUnlocked(userId, {
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        celebrationMessage: achievement.metadata?.celebrationMessage,
      });
    }
    return this.userAchievementRepository.save(userAchievement);
  }

  // Get all achievements and user progress
  async getUserAchievements(userId: string) {
    const achievements = await this.achievementRepository.find();
    const userAchievements = await this.userAchievementRepository.find({ where: { userId } });
    return achievements.map((a) => {
      const ua = userAchievements.find((ua) => ua.achievementId === a.id);
      return {
        ...a,
        progress: ua?.progress || 0,
        isUnlocked: ua?.isUnlocked || false,
        unlockedAt: ua?.unlockedAt,
      };
    });
  }

  // Analytics: completion rates
  async getAchievementAnalytics() {
    const achievements = await this.achievementRepository.find();
    const totalUsers = await this.userAchievementRepository.count();
    const analytics = [];
    for (const achievement of achievements) {
      const unlockedCount = await this.userAchievementRepository.count({ where: { achievementId: achievement.id, isUnlocked: true } });
      analytics.push({
        achievementId: achievement.id,
        name: achievement.name,
        unlockedCount,
        unlockRate: totalUsers ? (unlockedCount / totalUsers) * 100 : 0,
      });
    }
    return analytics;
  }

  // Social sharing (stub)
  async shareAchievement(userId: string, achievementId: string) {
    // Generate shareable link or message
    return {
      url: `https://yourgame.com/user/${userId}/achievement/${achievementId}`,
      message: 'Check out my achievement!'
    };
  }

  // Content unlocking based on achievements
  async getUnlockedContent(userId: string) {
    // Example: return list of content IDs unlocked by achievements
    const unlocked = await this.userAchievementRepository.find({ where: { userId, isUnlocked: true } });
    // Map to content IDs (stub)
    return unlocked.map((ua) => ({ contentId: `content-for-${ua.achievementId}` }));
  }

  // Retroactive unlocking
  async retroactiveUnlock(userId: string, userContext: any) {
    return this.conditionEngine.evaluateAllForUser(userId, userContext);
  }
}
