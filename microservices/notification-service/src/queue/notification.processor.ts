import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationGateway } from '../common/gateways/notification.gateway';
import { NotificationChannel } from '../notifications/entities/notification.entity';
import { PushNotificationProvider } from '../notifications/providers/push-notification.provider';
import { RabbitMQService } from '@quest-service/shared';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly notificationGateway: NotificationGateway,
        private readonly pushProvider: PushNotificationProvider,
        private readonly rabbitMQService: RabbitMQService,
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
                    await this.processPush(job);
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

    private async processPush(job: Job) {
        const { tokens, content, type } = job.data;

        if (!tokens?.length) {
            this.logger.warn('No tokens provided for push notification');
            return;
        }

        const payload = {
            title: content.subject || 'New Notification',
            body: content.body || 'You have a new notification',
            data: content,
        };

        const result = type === 'broadcast'
            ? await this.pushProvider.sendBroadcast(tokens, payload)
            : await this.pushProvider.sendToTokens(tokens, payload);

        this.logger.log(`Push sent: ${result.successCount} success, ${result.failureCount} failure`);

        if (result.staleTokens.length > 0) {
            await this.rabbitMQService.publish('', 'notification_stale_tokens_queue', {
                tokens: result.staleTokens,
            });
            this.logger.log(`Reported ${result.staleTokens.length} stale tokens`);
        }
    }

    private async processEmail(userId: string, content: any, type: string) {
        this.logger.log(`Sending Email notification to user ${userId} (Mock)`);
        // Placeholder for actual email provider logic (SendGrid, SES, etc.)
    }
}
