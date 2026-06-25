import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';
import { PushNotificationStatus } from '../notifications/entities/push-notification.entity';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectQueue('push-notifications')
    private readonly pushQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processScheduledNotifications() {
    const scheduled =
      await this.notificationsService.getScheduledNotifications();

    if (scheduled.length === 0) return;

    this.logger.log(
      `Processing ${scheduled.length} scheduled notifications`,
    );

    for (const notification of scheduled) {
      try {
        await this.notificationsService.updateStatus(
          notification.id,
          PushNotificationStatus.QUEUED,
        );

        await this.pushQueue.add('send-push', {
          notificationId: notification.id,
          userId: notification.userId,
        });

        this.logger.log(
          `Scheduled notification ${notification.id} queued for delivery`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process scheduled notification ${notification.id}: ${(error as Error).message}`,
        );
      }
    }
  }
}
