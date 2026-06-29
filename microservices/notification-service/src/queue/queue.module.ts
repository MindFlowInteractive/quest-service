import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './notification.processor';
import { GatewayModule } from '../common/gateways/gateway.module';
import { PushNotificationProvider } from '../notifications/providers/push-notification.provider';
import { RabbitMQService } from '@quest-service/shared';
import { Notification } from '../notifications/entities/notification.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification]),
        BullModule.registerQueue({
            name: 'notifications',
        }),
        GatewayModule,
        WebhooksModule,
    ],
    providers: [NotificationProcessor, PushNotificationProvider, RabbitMQService],
    exports: [BullModule],
})
export class QueueModule { }
