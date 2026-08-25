import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { NotificationsProcessor } from './processors/notifications.processor';

import { Notification } from './entities/notification.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

import { NotificationsService } from './services/notifications.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { NotificationAggregationService } from './services/notification-aggregation.service';

import { NotificationSocketAuth } from './auth/notification-socket-auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationDelivery,
      NotificationPreference,
    ]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationPreferencesService,
    NotificationDeliveryService,
    NotificationAggregationService,
    NotificationsGateway,
    NotificationsProcessor,
    NotificationSocketAuth,
  ],
  exports: [
    NotificationsService,
    NotificationPreferencesService,
    NotificationDeliveryService,
  ],
})
export class NotificationsModule {}
