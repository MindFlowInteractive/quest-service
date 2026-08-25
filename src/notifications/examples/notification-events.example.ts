import { NotificationsService } from '../services/notifications.service';
import { NotificationType } from '../enums/notification-type.enum';

export async function questCompletedExample(
  notificationsService: NotificationsService,
  userId: string,
  questId: string,
) {
  return notificationsService.create({
    userId,
    type: NotificationType.QUEST_COMPLETED,
    title: 'Quest completed',
    message: 'You completed a quest.',
    data: { questId },
    deduplicationKey: `quest-completed:${questId}:${userId}`,
    aggregateKey: `quest-completed:${userId}`,
  });
}
