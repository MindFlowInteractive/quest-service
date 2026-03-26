import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';

import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

import { PrivacySettings } from './entities/privacy-settings.entity';
import { ConsentLog } from './entities/consent-log.entity';
import { DataAccessAudit } from './entities/data-access-audit.entity';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { User } from '../users/entities/user.entity';

import {
  PrivacySettingsService,
  DataExportService,
  DataDeletionService,
  DataRetentionService,
  AuditService,
} from './services';
import { ExportCompletedListener } from './listeners/export-completed.listener';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrivacySettings,
      ConsentLog,
      DataAccessAudit,
      DataExportRequest,
      DataDeletionRequest,
      User,
    ]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ConfigModule,
    NotificationsModule,
  ],
  controllers: [PrivacyController],
  providers: [
    PrivacyService,
    PrivacySettingsService,
    DataExportService,
    DataDeletionService,
    DataRetentionService,
    AuditService,
    ExportCompletedListener,
  ],
  exports: [
    PrivacyService,
    PrivacySettingsService,
    DataExportService,
    DataDeletionService,
    DataRetentionService,
    AuditService,
  ],
})
export class PrivacyModule {}
