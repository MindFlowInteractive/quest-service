import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ContentReport } from './entities/content-report.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportEventsListener } from './listeners/report-events.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentReport]),
    EventEmitterModule,
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportEventsListener],
  exports: [ReportsService],
})
export class ReportsModule {}
