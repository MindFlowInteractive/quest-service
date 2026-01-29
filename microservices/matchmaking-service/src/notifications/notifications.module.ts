import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { Device } from './entities/device.entity';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { NotificationsController } from './notifications.controller';
import { PushService } from './push.service';
import { DevicesController } from './devices.controller';
import { User } from '../users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationDelivery, Device, User]), ConfigModule],
  providers: [NotificationService, EmailService, PushService],
  controllers: [NotificationsController, DevicesController],
  exports: [NotificationService],
})
export class NotificationsModule {}
