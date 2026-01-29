import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationGateway } from '../common/gateways/notification.gateway';
import { NotificationChannel } from '../notifications/entities/notification.entity';
import { PushNotificationProvider } from '../notifications/providers/push-notification.provider';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly notificationGateway: NotificationGateway,
        private readonly pushProvider: PushNotificationProvider,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { userId, content, channels, type } = job.data;

        this.logger.log(`Processing notification for user ${userId} (type: ${type})`);

        for (const channel of channels) {
            switch (channel) {
                case NotificationChannel.WEBSOCKET:
                    await this.processWebSocket(userId, content, type);
                    break;
                case NotificationChannel.PUSH:
                    await this.processPush(userId, content, type);
                    break;
                case NotificationChannel.EMAIL:
                    await this.processEmail(userId, content, type);
                    break;
                default:
                    this.logger.warn(`Unsupported channel: ${channel}`);
            }
        }

        return { success: true };
    }

    private async processWebSocket(userId: string, content: any, type: string) {
        this.logger.log(`Sending WebSocket notification to user ${userId}`);
        const delivered = this.notificationGateway.sendToUser(userId, {
            type,
            ...content,
        });
        if (!delivered) {
            this.logger.warn(`User ${userId} not connected via WebSocket`);
        }
    }

    private async processPush(userId: string, content: any, type: string) {
        this.logger.log(`Sending Push notification to user ${userId}`);
        await this.pushProvider.sendPush(userId, {
            title: content.subject || 'New Notification',
            body: content.body || 'You have a new notification',
            data: { type, ...content },
        });
    }

    private async processEmail(userId: string, content: any, type: string) {
        this.logger.log(`Sending Email notification to user ${userId} (Mock)`);
        // Placeholder for actual email provider logic (SendGrid, SES, etc.)
    }
}
