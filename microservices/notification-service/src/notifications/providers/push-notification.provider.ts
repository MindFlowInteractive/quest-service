import { Injectable, Logger } from '@nestjs/common';

export interface PushPayload {
    title: string;
    body: string;
    data?: any;
}

@Injectable()
export class PushNotificationProvider {
    private readonly logger = new Logger(PushNotificationProvider.name);

    async sendPush(userId: string, payload: PushPayload): Promise<boolean> {
        this.logger.log(`Sending push notification to user ${userId}: ${payload.title}`);
        // Here you would integrate with FCM, OneSignal, etc.
        return true;
    }
}
