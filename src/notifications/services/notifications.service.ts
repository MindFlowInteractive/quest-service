import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';

import { Notification } from '../entities/notification.entity';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { NotificationStatus } from '../enums/notification-status.enum';
import { CreateNotificationInput } from '../interfaces/create-notification.interface';
import { NotificationJobData } from '../interfaces/notification-job.interface';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationAggregationService } from './notification-aggregation.service';

@Injectable()
export class NotificationsService {
  private readonly maxAttempts = Number(
    process.env.NOTIFICATION_MAX_ATTEMPTS ?? 5,
  );
  private readonly retryDelay = Number(
    process.env.NOTIFICATION_RETRY_DELAY_MS ?? 1000,
  );

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepository: Repository<NotificationDelivery>,

    @InjectQueue('notifications')
    private readonly queue: Queue<NotificationJobData>,

    private readonly preferencesService: NotificationPreferencesService,
    private readonly deliveryService: NotificationDeliveryService,
    private readonly aggregationService: NotificationAggregationService,
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification | null> {
    const enabled = await this.preferencesService.isEnabled(
      input.userId,
      input.type,
    );

    if (!enabled) {
      return null;
    }

    if (input.deduplicationKey) {
      const existing = await this.notificationRepository.findOne({
        where: { deduplicationKey: input.deduplicationKey },
      });

      if (existing) {
        return existing;
      }
    }

    if (input.aggregateKey) {
      await this.aggregationService.increment(input.userId, input.aggregateKey);
    }

    let notification: Notification;

    try {
      notification = this.notificationRepository.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? null,
        status: NotificationStatus.PENDING,
        deduplicationKey: input.deduplicationKey ?? null,
        aggregationKey: input.aggregateKey ?? null,
      });

      notification = await this.notificationRepository.save(notification);
    } catch (error) {
      if (input.deduplicationKey && this.isUniqueViolation(error)) {
        const existing = await this.notificationRepository.findOne({
          where: { deduplicationKey: input.deduplicationKey },
        });

        if (existing) {
          return existing;
        }
      }

      throw error;
    }

    await this.deliveryService.createPending(notification.id);

    await this.queue.add(
      'deliver',
      {
        notificationId: notification.id,
        userId: notification.userId,
      },
      {
        jobId: `notification:${notification.id}`,
        attempts: this.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: this.retryDelay,
        },
        priority: notification.type === 'SYSTEM' ? 1 : 10,
        removeOnComplete: 1000,
        removeOnFail: false,
      },
    );

    return notification;
  }

  async history(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: [
        { userId, status: NotificationStatus.PENDING },
        { userId, status: NotificationStatus.DELIVERED },
      ],
    });
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        status: NotificationStatus.READ,
        readAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('user_id = :userId', { userId })
      .andWhere('status != :status', {
        status: NotificationStatus.READ,
      })
      .execute();
  }

  private isUniqueViolation(error: unknown): boolean {
    return Boolean(
      error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === '23505',
    );
  }
}
