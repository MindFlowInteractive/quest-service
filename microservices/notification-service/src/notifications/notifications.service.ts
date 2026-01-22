import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Notification, NotificationChannel, NotificationStatus } from './entities/notification.entity';
import { TemplateEngineService } from '../templates/template-engine.service';
import { NotificationTemplate } from '../templates/entities/template.entity';
import { UserPreference } from '../preferences/entities/preference.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(NotificationTemplate)
        private readonly templateRepository: Repository<NotificationTemplate>,
        @InjectRepository(UserPreference)
        private readonly preferenceRepository: Repository<UserPreference>,
        private readonly templateEngine: TemplateEngineService,
        @InjectQueue('notifications')
        private readonly notificationQueue: Queue,
    ) { }

    async send(userId: string, type: string, data: any) {
        this.logger.log(`Sending notification ${type} to user ${userId}`);

        // 1. Get user preferences
        const preferences = await this.preferenceRepository.find({
            where: { userId, notificationType: type, isEnabled: true },
        });

        const channels = preferences.length > 0
            ? preferences.map(p => p.channel)
            : [NotificationChannel.WEBSOCKET]; // Default

        // 2. Get template
        const template = await this.templateRepository.findOne({ where: { type } });

        let content = data;
        if (template) {
            content = {
                subject: template.subject ? this.templateEngine.render(template.subject, data) : undefined,
                body: this.templateEngine.render(template.body, data),
                ...data
            };
        }

        // 3. Save to DB
        const notification = this.notificationRepository.create({
            userId,
            type,
            content,
            channels,
            status: NotificationStatus.PENDING,
        });
        await this.notificationRepository.save(notification);

        // 4. Add to queue
        await this.notificationQueue.add('send-notification', {
            notificationId: notification.id,
            userId,
            type,
            content,
            channels,
        });

        return notification;
    }

    async markAsRead(id: string) {
        await this.notificationRepository.update(id, {
            isRead: true,
            readAt: new Date(),
            status: NotificationStatus.READ,
        });
    }

    async getUserNotifications(userId: string) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
}
