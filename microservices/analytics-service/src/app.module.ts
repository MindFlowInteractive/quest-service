import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { SharedModule } from '@quest-service/shared';
import { AppDataSource } from './config/orm-config';
import { EventsModule } from './events/events.module';
import { MetricsModule } from './metrics/metrics.module';
import { ReportsModule } from './reports/reports.module';
import { ServiceRegistrationService } from './services/service-registration.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    SharedModule,
    EventsModule,
    MetricsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ServiceRegistrationService,
  ],
})
export class AppModule {}
