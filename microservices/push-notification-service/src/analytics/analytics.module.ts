import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PushNotification } from '../notifications/entities/push-notification.entity';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [TypeOrmModule.forFeature([PushNotification]), DeliveryModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
