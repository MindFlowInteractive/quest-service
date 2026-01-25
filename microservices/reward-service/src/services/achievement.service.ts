import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { RewardService } from './reward.service';

@Injectable()
export class AchievementService {
  private readonly logger = new Logger(AchievementService.name);

  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    private rewardService: RewardService,
  ) {}

  async createAchievement(achievementData: Partial<Achievement>): Promise<Achievement> {
    const achievement = new Achievement();
    Object.assign(achievement, achievementData);
    achievement.createdAt = new Date();
    achievement.updatedAt = new Date();
    
    return await this.achievementRepository.save(achievement);
  }

  async getAchievementById(id: string): Promise<Achievement> {
    return await this.achievementRepository.findOneOrFail({ where: { id } });
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    return await this.achievementRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return await this.achievementRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', createdAt: 'DESC' },
    });
  }

  async getUserAchievements(userId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    const userAchievements = await this.userAchievementRepository.find({
      where: { userId },
      relations: ['achievement'],
      order: { unlockedAt: 'DESC' },
    });

    return userAchievements as (UserAchievement & { achievement: Achievement })[];
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    // Verify achievement exists and is active
    const achievement = await this.achievementRepository.findOne({
      where: { id: achievementId, isActive: true },
    });

    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${achievementId} not found or inactive`);
    }

    // Check if already unlocked
    let userAchievement = await this.userAchievementRepository.findOne({
      where: { userId, achievementId },
    });

    if (userAchievement) {
      if (userAchievement.isUnlocked) {
        // Already unlocked, return existing record
        return userAchievement;
      } else {
        // Update existing record
        userAchievement.isUnlocked = true;
        userAchievement.unlockedAt = new Date();
        userAchievement.progress = 100; // Mark as 100% complete
      }
    } else {
      // Create new user achievement record
      userAchievement = new UserAchievement();
      userAchievement.userId = userId;
      userAchievement.achievementId = achievementId;
      userAchievement.isUnlocked = true;
      userAchievement.unlockedAt = new Date();
      userAchievement.progress = 100;
    }

    const savedUserAchievement = await this.userAchievementRepository.save(userAchievement);

    // Update achievement statistics
    await this.achievementRepository.update(
      { id: achievementId },
      {
        unlockedCount: () => `"unlocked_count" + 1`,
        unlockRate: () => `(CAST("unlocked_count" AS DECIMAL) + 1) / 100.0`, // Simplified calculation
      },
    );

    // Award reward for unlocking achievement
    if (achievement.points > 0) {
      await this.rewardService.distributeTokenReward(
        userId,
        achievement.points,
        `Achievement unlocked: ${achievement.name}`
      );
    }

    return savedUserAchievement;
  }

  async checkAndUnlockAchievements(userId: string, activityData: any): Promise<UserAchievement[]> {
    const unlockedAchievements: UserAchievement[] = [];
    
    // Get all active achievements
    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
    });

    for (const achievement of achievements) {
      // Check if user already has this achievement
      const existingUserAchievement = await this.userAchievementRepository.findOne({
        where: { userId, achievementId: achievement.id },
      });

      if (existingUserAchievement && existingUserAchievement.isUnlocked) {
        continue; // Skip if already unlocked
      }

      // Check if achievement conditions are met
      if (this.checkAchievementConditions(achievement, activityData)) {
        const unlocked = await this.unlockAchievement(userId, achievement.id);
        unlockedAchievements.push(unlocked);
      }
    }

    return unlockedAchievements;
  }

  private checkAchievementConditions(achievement: Achievement, activityData: any): boolean {
    // This is a simplified implementation - in a real app, this would be more complex
    const conditions = achievement.unlockConditions;

    if (!conditions) {
      return false;
    }

    // Check if user meets achievement prerequisites
    if (achievement.prerequisites && achievement.prerequisites.length > 0) {
      // In a real implementation, you'd check if user has unlocked prerequisite achievements
    }

    // Example condition checks - this would be expanded based on actual requirements
    if (conditions.type === 'puzzle_solved' && conditions.count) {
      return activityData.puzzleCount >= conditions.count;
    }

    if (conditions.type === 'streak' && conditions.days) {
      return activityData.streakDays >= conditions.days;
    }

    if (conditions.type === 'score_reached' && conditions.threshold) {
      return activityData.score >= conditions.threshold;
    }

    // Add more condition types as needed
    return false;
  }

  async updateUserProgress(userId: string, activityType: string, data: any): Promise<UserAchievement[]> {
    // This method would be called when a user performs an activity
    // It would check if any achievements should be unlocked based on the activity
    
    // Prepare activity data for achievement checking
    const activityData = {
      type: activityType,
      ...data,
      userId,
      timestamp: new Date(),
    };

    // Check and potentially unlock achievements
    return await this.checkAndUnlockAchievements(userId, activityData);
  }
}