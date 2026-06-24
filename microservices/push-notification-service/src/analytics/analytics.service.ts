import { Injectable } from '@nestjs/common';
import { DeliveryService } from '../delivery/delivery.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PushNotification,
  PushNotificationStatus,
} from '../notifications/entities/push-notification.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly deliveryService: DeliveryService,
    @InjectRepository(PushNotification)
    private readonly notificationRepo: Repository<PushNotification>,
  ) {}

  async getOverview(): Promise<{
    totalNotifications: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    cancelledCount: number;
    pendingCount: number;
    deliveryStats: any;
  }> {
    const totalNotifications = await this.notificationRepo.count();
    const sentCount = await this.notificationRepo.count({
      where: { status: PushNotificationStatus.SENT },
    });
    const deliveredCount = await this.notificationRepo.count({
      where: { status: PushNotificationStatus.DELIVERED },
    });
    const failedCount = await this.notificationRepo.count({
      where: { status: PushNotificationStatus.FAILED },
    });
    const cancelledCount = await this.notificationRepo.count({
      where: { status: PushNotificationStatus.CANCELLED },
    });
    const pendingCount = await this.notificationRepo.count({
      where: { status: PushNotificationStatus.PENDING },
    });

    const deliveryStats = await this.deliveryService.getOverallStats();

    return {
      totalNotifications,
      sentCount,
      deliveredCount,
      failedCount,
      cancelledCount,
      pendingCount,
      deliveryStats,
    };
  }

  async getBySegment(segmentId: string): Promise<{
    segmentId: string;
    totalNotifications: number;
    sentCount: number;
    failedCount: number;
  }> {
    const notifications = await this.notificationRepo.find({
      where: { segmentId },
    });

    return {
      segmentId,
      totalNotifications: notifications.length,
      sentCount: notifications.filter(
        (n) => n.status === PushNotificationStatus.SENT,
      ).length,
      failedCount: notifications.filter(
        (n) => n.status === PushNotificationStatus.FAILED,
      ).length,
    };
  }

  async getByNotification(notificationId: string): Promise<{
    notificationId: string;
    deliveryBreakdown: any;
  }> {
    const deliveryStats =
      await this.deliveryService.getDeliveryStats(notificationId);

    return {
      notificationId,
      deliveryBreakdown: deliveryStats,
    };
  }
}
