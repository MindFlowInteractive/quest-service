import { Injectable, Logger } from '@nestjs/common';

export interface UnlockNotificationPayload {
  userId: string;
  achievementCode: string;
  achievementName: string;
  rarity: string;
  badgeName?: string;
  unlockedAt: string;
}

@Injectable()
export class AchievementNotificationService {
  private readonly logger = new Logger(AchievementNotificationService.name);

  async sendUnlockNotification(payload: UnlockNotificationPayload): Promise<{
    delivered: boolean;
    channel: 'webhook' | 'log';
  }> {
    const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'achievement.unlocked',
          data: payload,
        }),
      });

      return {
        delivered: true,
        channel: 'webhook',
      };
    }

    this.logger.log(
      `Achievement unlock notification: ${payload.userId} unlocked ${payload.achievementCode}`,
    );

    return {
      delivered: true,
      channel: 'log',
    };
  }
}
