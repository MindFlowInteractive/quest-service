import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from '../entities/notification.entity';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { NotificationDeliveryStatus } from '../enums/notification-delivery-status.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Injectable()
export class NotificationDeliveryService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepository: Repository<NotificationDelivery>,
  ) {}

  async createPending(notificationId: string): Promise<NotificationDelivery> {
    const delivery = this.deliveryRepository.create({
      notificationId,
      status: NotificationDeliveryStatus.PENDING,
      attempts: 0,
    });

    return this.deliveryRepository.save(delivery);
  }

  async recordAttempt(
    notificationId: string,
    error?: Error,
  ): Promise<NotificationDelivery> {
    let delivery = await this.deliveryRepository.findOne({
      where: { notificationId },
    });

    if (!delivery) {
      delivery = this.deliveryRepository.create({
        notificationId,
        status: NotificationDeliveryStatus.PENDING,
        attempts: 0,
      });
    }

    delivery.attempts += 1;
    delivery.lastAttemptAt = new Date();

    if (error) {
      delivery.failureReason = error.message;
    }

    return this.deliveryRepository.save(delivery);
  }

  async acknowledge(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException();
    }

    notification.status = NotificationStatus.DELIVERED;
    await this.notificationRepository.save(notification);

    await this.deliveryRepository.update(
      { notificationId },
      {
        status: NotificationDeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        failureReason: null,
      },
    );

    return notification;
  }

  async markFailed(
    notificationId: string,
    error: Error,
  ): Promise<void> {
    await this.deliveryRepository.update(
      { notificationId },
      {
        status: NotificationDeliveryStatus.FAILED,
        failedAt: new Date(),
        failureReason: error.message,
      },
    );

    await this.notificationRepository.update(
      { id: notificationId },
      {
        status: NotificationStatus.FAILED,
      },
    );
  }
}
