

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { AchievementConditionGroup, UserContext } from './types/achievement-condition.types';

@Injectable()
export class AchievementConditionEngine {
  private readonly logger = new Logger(AchievementConditionEngine.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchievementRepo: Repository<UserAchievement>,
  ) {}

  /**
   * Evaluate if a user meets the condition for an achievement.
   */

  validateConditionGroup(group: AchievementConditionGroup) {
    if (!group || !group.type || !Array.isArray(group.conditions)) {
      throw new BadRequestException('Invalid achievement condition group');
    }
    // Further validation can be added here
  }

  async evaluate(userId: string, achievement: Achievement, userContext: UserContext): Promise<boolean> {
    this.validateConditionGroup(achievement.unlockConditions);
    // Example: only support single stat condition for now
    const group = achievement.unlockConditions;
    if (group.type === 'single' && group.conditions.length === 1) {
      const cond = group.conditions[0];
      if (cond.type === 'score_threshold' && cond.operator === 'greater_than') {
        return userContext[cond.id] > cond.value;
      }
      // Add more condition types/operators as needed
    }
    // Add more group types as needed
    return false;
  }

  /**
   * Evaluate all achievements for a user (for retroactive unlocking)
   */
  async evaluateAllForUser(userId: string, userContext: UserContext): Promise<string[]> {
    const achievements = await this.achievementRepo.find({ where: { isActive: true } });
    const unlocked: string[] = [];
    for (const achievement of achievements) {
      const already = await this.userAchievementRepo.findOne({ where: { userId, achievementId: achievement.id } });
      if (!already?.isUnlocked) {
        const ok = await this.evaluate(userId, achievement, userContext);
        if (ok) {
          await this.userAchievementRepo.save({
            userId,
            achievementId: achievement.id,
            isUnlocked: true,
            unlockedAt: new Date(),
            progress: 100,
            progressTotal: 100,
          });
          unlocked.push(achievement.id);
        }
      }
    }
    return unlocked;
  }
}
