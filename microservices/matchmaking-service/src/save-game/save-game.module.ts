import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

// Entities
import { SaveGame } from './entities/save-game.entity';
import { SaveGameBackup } from './entities/save-game-backup.entity';
import { SaveGameAnalytics } from './entities/save-game-analytics.entity';

// Services
import { SaveGameService } from './services/save-game.service';
import { CloudSyncService } from './services/cloud-sync.service';
import { SaveCompressionService } from './services/save-compression.service';
import { SaveEncryptionService } from './services/save-encryption.service';
import { SaveVersioningService } from './services/save-versioning.service';
import { SaveBackupService } from './services/save-backup.service';
import { SaveAnalyticsService } from './services/save-analytics.service';
import { AutoSaveService } from './services/auto-save.service';

// Controllers
import { SaveGameController } from './controllers/save-game.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaveGame, SaveGameBackup, SaveGameAnalytics]),
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  controllers: [SaveGameController],
  providers: [
    SaveCompressionService,
    SaveEncryptionService,
    SaveVersioningService,
    SaveAnalyticsService,
    SaveBackupService,
    SaveGameService,
    CloudSyncService,
    AutoSaveService,
  ],
  exports: [
    SaveGameService,
    CloudSyncService,
    AutoSaveService,
    SaveBackupService,
    SaveAnalyticsService,
  ],
})
export class SaveGameModule {}
