import { Injectable, Logger } from '@nestjs/common';

export interface ModerationNotification {
    userId: string;
    type: 'WARNING' | 'SUSPENSION' | 'BAN' | 'APPEAL_RECEIVED' | 'APPEAL_RESOLVED';
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    /**
     * Send notification to user about moderation action.
     * In production, this would use gRPC/RabbitMQ to communicate with notification-service.
     */
    async sendModerationNotification(notification: ModerationNotification): Promise<void> {
        this.logger.log(
            `[NOTIFICATION] Sending ${notification.type} notification to user ${notification.userId}: ${notification.title}`,
        );

        // TODO: Integrate with notification-service via gRPC or RabbitMQ
        // Example using EventPublisher from @quest-service/shared:
        // await this.eventPublisher.publishEvent('ModerationNotification', notification, 'moderation-service');

        // For now, we log the notification
        this.logger.debug(`Notification payload: ${JSON.stringify(notification)}`);
    }

    async notifyUserWarning(userId: string, reason: string): Promise<void> {
        await this.sendModerationNotification({
            userId,
            type: 'WARNING',
            title: 'Community Guidelines Warning',
            message: `You have received a warning for: ${reason}. Please review our community guidelines.`,
            metadata: { reason },
        });
    }

    async notifyUserSuspension(userId: string, reason: string, duration?: string): Promise<void> {
        await this.sendModerationNotification({
            userId,
            type: 'SUSPENSION',
            title: 'Account Suspended',
            message: `Your account has been suspended for: ${reason}. ${duration ? `Duration: ${duration}` : ''}`,
            metadata: { reason, duration },
        });
    }

    async notifyUserBan(userId: string, reason: string): Promise<void> {
        await this.sendModerationNotification({
            userId,
            type: 'BAN',
            title: 'Account Banned',
            message: `Your account has been permanently banned for: ${reason}. You may submit an appeal if you believe this was a mistake.`,
            metadata: { reason },
        });
    }

    async notifyAppealReceived(userId: string, appealId: string): Promise<void> {
        await this.sendModerationNotification({
            userId,
            type: 'APPEAL_RECEIVED',
            title: 'Appeal Received',
            message: 'Your appeal has been received and is under review. We will notify you of the outcome.',
            metadata: { appealId },
        });
    }

    async notifyAppealResolved(userId: string, outcome: 'ACCEPTED' | 'REJECTED', comments?: string): Promise<void> {
        const message = outcome === 'ACCEPTED'
            ? 'Your appeal has been accepted. The action against your account has been reversed.'
            : `Your appeal has been rejected. ${comments || 'The original decision stands.'}`;

        await this.sendModerationNotification({
            userId,
            type: 'APPEAL_RESOLVED',
            title: `Appeal ${outcome === 'ACCEPTED' ? 'Accepted' : 'Rejected'}`,
            message,
            metadata: { outcome, comments },
        });
    }
}
