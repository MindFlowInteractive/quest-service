import { Injectable, Logger } from '@nestjs/common';
import { Achievement } from '../entities/achievement.entity';
import { Badge } from '../entities/badge.entity';

@Injectable()
export class AchievementNotificationService {
  private readonly logger = new Logger(AchievementNotificationService.name);

  async notifyUnlock(userId: string, achievement: Achievement, badge: Badge): Promise<void> {
    // TODO: Integrate with real notification infrastructure (e.g., event bus or notification-service)
    this.logger.log(
      `Notification: user ${userId} unlocked achievement ${achievement.code} (${achievement.name}), badge ${badge.id}`,
    );
  }
}
