import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AchievementProgress } from '../entities/achievement-progress.entity';
import { BadgeService } from './badge.service';
import { AchievementNotificationService } from './achievement-notification.service';

@Injectable()
export class AchievementUnlockService {
  constructor(
    @InjectRepository(AchievementProgress)
    private readonly progressRepo: Repository<AchievementProgress>,
    private readonly badgeService: BadgeService,
    private readonly notificationService: AchievementNotificationService,
  ) {}

  async evaluateAndUnlock(progress: AchievementProgress): Promise<void> {
    const { achievement } = progress;

    if (progress.isUnlocked) {
      return;
    }

    if (progress.currentValue >= achievement.targetValue) {
      progress.isUnlocked = true;
      progress.unlockedAt = new Date();
      await this.progressRepo.save(progress);

      const badge = await this.badgeService.awardBadge(progress.userId, achievement);

      await this.notificationService.notifyUnlock(progress.userId, achievement, badge);
    }
  }
}
