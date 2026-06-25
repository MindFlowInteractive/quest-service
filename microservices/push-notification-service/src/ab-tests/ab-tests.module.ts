import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ABTestsService } from './ab-tests.service';
import { ABTestsController } from './ab-tests.controller';
import { ABTest } from './entities/ab-test.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { PushNotification } from '../notifications/entities/push-notification.entity';
import { SegmentsModule } from '../segments/segments.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ABTest, PushNotification, Delivery]),
    SegmentsModule,
    QueueModule,
  ],
  controllers: [ABTestsController],
  providers: [ABTestsService],
  exports: [ABTestsService],
})
export class ABTestsModule {}
