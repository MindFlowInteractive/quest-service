import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NotificationPreference } from '../entities/notification-preference.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';

@Injectable()
export class NotificationPreferencesService {
  constructor(
    @InjectRepository(NotificationPreference)
    private readonly repository: Repository<NotificationPreference>,
  ) {}

  async getOrCreate(userId: string): Promise<NotificationPreference> {
    let preferences = await this.repository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.repository.create({ userId });
      preferences = await this.repository.save(preferences);
    }

    return preferences;
  }

  async update(
    userId: string,
    input: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreference> {
    const preferences = await this.getOrCreate(userId);
    Object.assign(preferences, input);
    return this.repository.save(preferences);
  }

  async isEnabled(userId: string, type: NotificationType): Promise<boolean> {
    const preferences = await this.getOrCreate(userId);

    const propertyMap: Record<NotificationType, keyof NotificationPreference> =
      {
        [NotificationType.QUEST_ASSIGNED]: 'questAssigned',
        [NotificationType.QUEST_COMPLETED]: 'questCompleted',
        [NotificationType.QUEST_APPROVED]: 'questApproved',
        [NotificationType.QUEST_REJECTED]: 'questRejected',
        [NotificationType.REWARD_RECEIVED]: 'rewardReceived',
        [NotificationType.ACHIEVEMENT_UNLOCKED]: 'achievementUnlocked',
        [NotificationType.LEVEL_UP]: 'levelUp',
        [NotificationType.BADGE_EARNED]: 'badgeEarned',
        [NotificationType.SYSTEM]: 'system',
      };

    return Boolean(preferences[propertyMap[type]]);
  }
}
