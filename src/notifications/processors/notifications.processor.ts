import { Injectable } from '@nestjs/common';
import {
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';

import { Notification } from '../entities/notification.entity';
import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationJobData } from '../interfaces/notification-job.interface';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { NotificationDeliveryService } from '../services/notification-delivery.service';

@Processor('notifications', {
  concurrency: Number(process.env.NOTIFICATION_QUEUE_CONCURRENCY ?? 10),
})
@Injectable()
export class NotificationsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    private readonly gateway: NotificationsGateway,
    private readonly deliveryService: NotificationDeliveryService,
  ) {
    super();
  }

  async process(
    job: Job<NotificationJobData>,
  ): Promise<void> {
    const notification =
      await this.notificationRepository.findOne({
        where: { id: job.data.notificationId },
      });

    if (!notification) {
      throw new Error(
        `Notification ${job.data.notificationId} not found`,
      );
    }

    if (notification.status === NotificationStatus.READ) {
      return;
    }

    notification.status = NotificationStatus.PROCESSING;
    await this.notificationRepository.save(notification);

    const delivered = this.gateway.sendToUser(
      notification.userId,
      notification,
    );

    await this.deliveryService.recordAttempt(
      notification.id,
      delivered
        ? undefined
        : new Error('User is offline'),
    );

    if (!delivered) {
      notification.status = NotificationStatus.PENDING;
      await this.notificationRepository.save(notification);

      throw new Error(
        `User ${notification.userId} is offline`,
      );
    }

    // The notification is emitted now, but delivery is only finalized
    // after the client sends notification:ack.
    notification.status = NotificationStatus.PROCESSING;
    await this.notificationRepository.save(notification);
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job<NotificationJobData> | undefined,
    error: Error,
  ): Promise<void> {
    if (!job) {
      return;
    }

    const maxAttempts =
      job.opts.attempts ?? Number(process.env.NOTIFICATION_MAX_ATTEMPTS ?? 5);

    if (job.attemptsMade >= maxAttempts) {
      await this.deliveryService.markFailed(
        job.data.notificationId,
        error,
      );
    }
  }
}
