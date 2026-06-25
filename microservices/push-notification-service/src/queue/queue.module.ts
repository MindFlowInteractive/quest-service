import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PushProcessor } from './push.processor';
import { PushNotification } from '../notifications/entities/push-notification.entity';
import { DevicesModule } from '../devices/devices.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { FcmProvider } from '../providers/fcm.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushNotification]),
    BullModule.registerQueue({
      name: 'push-notifications',
    }),
    DevicesModule,
    DeliveryModule,
  ],
  providers: [PushProcessor, FcmProvider],
  exports: [BullModule, FcmProvider],
})
export class QueueModule {}
