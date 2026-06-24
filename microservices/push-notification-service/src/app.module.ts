import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppDataSource } from './config/orm-config';
import { NotificationsModule } from './notifications/notifications.module';
import { DevicesModule } from './devices/devices.module';
import { DeliveryModule } from './delivery/delivery.module';
import { SegmentsModule } from './segments/segments.module';
import { ABTestsModule } from './ab-tests/ab-tests.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(AppDataSource.options),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: Number(configService.get<number>('REDIS_PORT', 6379)),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    DevicesModule,
    DeliveryModule,
    SegmentsModule,
    QueueModule,
    NotificationsModule,
    ABTestsModule,
    AnalyticsModule,
    SchedulingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
