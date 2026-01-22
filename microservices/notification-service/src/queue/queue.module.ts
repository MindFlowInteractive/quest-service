import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification.processor';
import { GatewayModule } from '../common/gateways/gateway.module';
import { PushNotificationProvider } from '../notifications/providers/push-notification.provider';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'notifications',
        }),
        GatewayModule,
    ],
    providers: [NotificationProcessor, PushNotificationProvider],
    exports: [BullModule],
})
export class QueueModule { }
