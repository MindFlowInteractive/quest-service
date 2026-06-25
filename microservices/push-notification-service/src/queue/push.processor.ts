import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PushNotification,
  PushNotificationStatus,
} from '../notifications/entities/push-notification.entity';
import { DevicesService } from '../devices/devices.service';
import { DeliveryService } from '../delivery/delivery.service';
import { FcmProvider } from '../providers/fcm.provider';

interface PushJobResult {
  success: boolean;
  error?: string;
  successCount?: number;
  failureCount?: number;
}

@Processor('push-notifications')
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    @InjectRepository(PushNotification)
    private readonly notificationRepo: Repository<PushNotification>,
    private readonly devicesService: DevicesService,
    private readonly deliveryService: DeliveryService,
    private readonly fcmProvider: FcmProvider,
  ) {
    super();
  }

  async process(
    job: Job<{ notificationId: string; userId: string }>,
  ): Promise<PushJobResult> {
    const { notificationId, userId } = job.data;

    this.logger.log(
      `Processing push notification ${notificationId} for user ${userId}`,
    );

    // 1. Get the notification
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      this.logger.error(`Notification ${notificationId} not found`);
      return { success: false, error: 'Notification not found' };
    }

    if (notification.status === PushNotificationStatus.CANCELLED) {
      this.logger.log(`Notification ${notificationId} was cancelled, skipping`);
      return { success: false, error: 'Notification cancelled' };
    }

    // 2. Get user's active device tokens
    const devices = await this.devicesService.getByUser(userId);

    if (!devices.length) {
      this.logger.warn(`No active devices found for user ${userId}`);
      await this.notificationRepo.update(notificationId, {
        status: PushNotificationStatus.FAILED,
        errorMessage: 'No active devices',
      });
      return { success: false, error: 'No active devices' };
    }

    const tokens = devices.map((d) => d.token);

    // 3. Create delivery records
    const deliveryRecords = await Promise.all(
      devices.map((device) =>
        this.deliveryService.recordDeliveryAttempt(
          notificationId,
          device.id,
          device.token,
        ),
      ),
    );

    // 4. Send via FCM
    const payload = {
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
      data: notification.data
        ? Object.fromEntries(
            Object.entries(notification.data).map(([k, v]) => [k, String(v)]),
          )
        : undefined,
    };

    const result = await this.fcmProvider.sendToTokens(tokens, payload);

    // 5. Update delivery records based on FCM response
    for (let i = 0; i < result.responses.length; i++) {
      const resp = result.responses[i];
      const delivery = deliveryRecords[i];

      if (resp.success) {
        await this.deliveryService.markSent(delivery.id, resp.messageId);
      } else {
        await this.deliveryService.markFailed(
          delivery.id,
          resp.errorCode || 'unknown',
          resp.errorMessage || 'Unknown error',
        );
      }
    }

    // 6. Deactivate stale tokens
    if (result.staleTokens.length > 0) {
      await this.devicesService.deactivateStaleTokens(result.staleTokens);
    }

    // 7. Update notification status
    const allFailed = result.successCount === 0;
    await this.notificationRepo.update(notificationId, {
      status: allFailed
        ? PushNotificationStatus.FAILED
        : PushNotificationStatus.SENT,
      sentAt: new Date(),
      errorMessage: allFailed
        ? `All ${result.failureCount} deliveries failed`
        : undefined,
    });

    this.logger.log(
      `Push notification ${notificationId}: ${result.successCount} sent, ${result.failureCount} failed`,
    );

    return {
      success: !allFailed,
      successCount: result.successCount,
      failureCount: result.failureCount,
    };
  }
}
