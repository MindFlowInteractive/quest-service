import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  PushNotification,
  PushNotificationStatus,
  PushNotificationType,
  PushNotificationPriority,
} from './entities/push-notification.entity';
import {
  SendPushNotificationDto,
  SchedulePushNotificationDto,
  BroadcastPushNotificationDto,
} from './dto/notification.dto';
import { SegmentsService } from '../segments/segments.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(PushNotification)
    private readonly notificationRepo: Repository<PushNotification>,
    @InjectQueue('push-notifications')
    private readonly pushQueue: Queue,
    private readonly segmentsService: SegmentsService,
  ) {}

  async send(dto: SendPushNotificationDto): Promise<PushNotification> {
    this.logger.log(`Sending push notification to user ${dto.userId}`);

    const notification = this.notificationRepo.create({
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      imageUrl: dto.imageUrl,
      type: dto.type || PushNotificationType.TRANSACTIONAL,
      priority: dto.priority || PushNotificationPriority.NORMAL,
      status: PushNotificationStatus.QUEUED,
    });

    await this.notificationRepo.save(notification);

    await this.pushQueue.add('send-push', {
      notificationId: notification.id,
      userId: dto.userId,
    });

    return notification;
  }

  async schedule(dto: SchedulePushNotificationDto): Promise<PushNotification> {
    this.logger.log(
      `Scheduling push notification for user ${dto.userId} at ${dto.scheduledAt}`,
    );

    const notification = this.notificationRepo.create({
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      imageUrl: dto.imageUrl,
      type: dto.type || PushNotificationType.TRANSACTIONAL,
      priority: dto.priority || PushNotificationPriority.NORMAL,
      status: PushNotificationStatus.PENDING,
      scheduledAt: new Date(dto.scheduledAt),
    });

    await this.notificationRepo.save(notification);

    return notification;
  }

  async broadcast(dto: BroadcastPushNotificationDto): Promise<PushNotification[]> {
    this.logger.log(`Broadcasting push notification to segment ${dto.segmentId}`);

    const devices = await this.segmentsService.resolveDevices(dto.segmentId);
    const userIds = [...new Set(devices.map((d) => d.userId))];

    const notifications: PushNotification[] = [];

    for (const userId of userIds) {
      const notification = this.notificationRepo.create({
        userId,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
        type: dto.type || PushNotificationType.PROMOTIONAL,
        priority: dto.priority || PushNotificationPriority.NORMAL,
        status: PushNotificationStatus.QUEUED,
        segmentId: dto.segmentId,
      });

      await this.notificationRepo.save(notification);

      await this.pushQueue.add('send-push', {
        notificationId: notification.id,
        userId,
      });

      notifications.push(notification);
    }

    this.logger.log(
      `Broadcast queued for ${notifications.length} users in segment ${dto.segmentId}`,
    );

    return notifications;
  }

  async cancel(id: string): Promise<PushNotification> {
    const notification = await this.notificationRepo.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (
      notification.status !== PushNotificationStatus.PENDING &&
      notification.status !== PushNotificationStatus.QUEUED
    ) {
      throw new BadRequestException(
        `Cannot cancel notification with status ${notification.status}`,
      );
    }

    notification.status = PushNotificationStatus.CANCELLED;
    await this.notificationRepo.save(notification);

    return notification;
  }

  async getUserHistory(userId: string): Promise<PushNotification[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: string): Promise<PushNotification> {
    const notification = await this.notificationRepo.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return notification;
  }

  async getScheduledNotifications(): Promise<PushNotification[]> {
    return this.notificationRepo.find({
      where: {
        status: PushNotificationStatus.PENDING,
        scheduledAt: LessThanOrEqual(new Date()),
      },
    });
  }

  async updateStatus(
    id: string,
    status: PushNotificationStatus,
    errorMessage?: string,
  ): Promise<void> {
    const update: Partial<PushNotification> = { status };
    if (status === PushNotificationStatus.SENT) {
      update.sentAt = new Date();
    }
    if (errorMessage) {
      update.errorMessage = errorMessage;
    }
    await this.notificationRepo.update(id, update);
  }
}
