import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';
import { AchievementProgress } from '../entities/achievement-progress.entity';
import { AchievementUnlockService } from './achievement-unlock.service';

@Injectable()
export class AchievementProgressService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(AchievementProgress)
    private readonly progressRepo: Repository<AchievementProgress>,
    private readonly unlockService: AchievementUnlockService,
  ) {}

  /**
   * Record progress for a user on all achievements that track the given metric.
   */
  async recordProgress(userId: string, metric: string, increment: number): Promise<void> {
    const achievements = await this.achievementRepo.find({ where: { metric, isActive: true } });
    if (!achievements.length) return;

    for (const achievement of achievements) {
      let progress = await this.progressRepo.findOne({ where: { userId, achievement: { id: achievement.id } } });

      if (!progress) {
        progress = this.progressRepo.create({
          userId,
          achievement,
          currentValue: 0,
          isUnlocked: false,
        });
      }

      progress.currentValue += increment;
      await this.progressRepo.save(progress);

      await this.unlockService.evaluateAndUnlock(progress);
    }
  }

  async getUserProgress(userId: string): Promise<AchievementProgress[]> {
    return this.progressRepo.find({ where: { userId } });
  }
}
