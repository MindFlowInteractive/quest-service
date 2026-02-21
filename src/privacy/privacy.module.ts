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

import {
  PrivacySettingsService,
  DataExportService,
  DataDeletionService,
  DataRetentionService,
  AuditService,
} from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrivacySettings,
      ConsentLog,
      DataAccessAudit,
      DataExportRequest,
      DataDeletionRequest,
    ]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ConfigModule,
  ],
  controllers: [PrivacyController],
  providers: [
    PrivacyService,
    PrivacySettingsService,
    DataExportService,
    DataDeletionService,
    DataRetentionService,
    AuditService,
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
