import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification.processor';
import { GatewayModule } from '../common/gateways/gateway.module';
import { PushNotificationProvider } from '../notifications/providers/push-notification.provider';
import { RabbitMQService } from '@quest-service/shared';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'notifications',
        }),
        GatewayModule,
    ],
    providers: [NotificationProcessor, PushNotificationProvider, RabbitMQService],
    exports: [BullModule],
})
export class QueueModule { }
