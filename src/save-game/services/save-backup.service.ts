import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SaveGame } from '../entities/save-game.entity';
import { SaveGameBackup, BackupReason } from '../entities/save-game-backup.entity';
import { SaveCompressionService } from './save-compression.service';
import { SaveEncryptionService } from './save-encryption.service';
import { SaveType } from '../interfaces/save-game.interfaces';

@Injectable()
export class SaveBackupService {
  private readonly logger = new Logger(SaveBackupService.name);

  // Backup retention periods in days
  private readonly SCHEDULED_BACKUP_RETENTION = 7;
  private readonly CONFLICT_BACKUP_RETENTION = 30;
  private readonly MANUAL_BACKUP_RETENTION = 90;

  // Maximum backups per save slot
  private readonly MAX_BACKUPS_PER_SLOT = 10;

  constructor(
    @InjectRepository(SaveGameBackup)
    private readonly backupRepo: Repository<SaveGameBackup>,
    @InjectRepository(SaveGame)
    private readonly saveGameRepo: Repository<SaveGame>,
    private readonly compressionService: SaveCompressionService,
    private readonly encryptionService: SaveEncryptionService,
  ) {}

  async createBackup(
    saveGame: SaveGame,
    reason: BackupReason,
  ): Promise<SaveGameBackup> {
    this.logger.debug(
      `Creating ${reason} backup for save ${saveGame.id} (slot ${saveGame.slotId})`,
    );

    // Determine retention period based on reason
    const retentionDays = this.getRetentionDays(reason);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    // Calculate checksum of compressed data
    const checksum = this.encryptionService.generateChecksum(saveGame.compressedData);

    const backup = this.backupRepo.create({
      saveGameId: saveGame.id,
      userId: saveGame.userId,
      slotId: saveGame.slotId,
      saveVersion: saveGame.saveVersion,
      reason,
      compressedData: saveGame.compressedData,
      checksum,
      dataSize: saveGame.compressedData?.length || 0,
      expiresAt,
    });

    const savedBackup = await this.backupRepo.save(backup);

    // Clean up old backups for this slot
    await this.cleanupOldBackups(saveGame.userId, saveGame.slotId);

    return savedBackup;
  }

  private getRetentionDays(reason: BackupReason): number {
    switch (reason) {
      case BackupReason.MANUAL:
        return this.MANUAL_BACKUP_RETENTION;
      case BackupReason.CONFLICT:
      case BackupReason.CORRUPTION_DETECTED:
        return this.CONFLICT_BACKUP_RETENTION;
      default:
        return this.SCHEDULED_BACKUP_RETENTION;
    }
  }

  async getBackups(userId: string, slotId?: number): Promise<SaveGameBackup[]> {
    const where: Record<string, unknown> = { userId };
    if (slotId !== undefined) {
      where.slotId = slotId;
    }

    return this.backupRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50, // Limit results
    });
  }

  async restoreFromBackup(backupId: string, userId: string): Promise<SaveGame> {
    const backup = await this.backupRepo.findOne({
      where: { id: backupId, userId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Verify checksum
    const currentChecksum = this.encryptionService.generateChecksum(backup.compressedData);
    if (currentChecksum !== backup.checksum) {
      throw new Error('Backup data corrupted - checksum mismatch');
    }

    // Find existing save or create new one
    let saveGame = await this.saveGameRepo.findOne({
      where: { userId, slotId: backup.slotId },
    });

    if (saveGame) {
      // Create a backup of current state before restore
      await this.createBackup(saveGame, BackupReason.PRE_UPDATE);

      // Restore from backup
      saveGame.compressedData = backup.compressedData;
      saveGame.saveVersion = backup.saveVersion;
      saveGame.lastModifiedAt = new Date();
      saveGame.isCorrupted = false;
      saveGame.corruptionReason = null;
    } else {
      // Create new save from backup
      saveGame = this.saveGameRepo.create({
        userId,
        slotId: backup.slotId,
        compressedData: backup.compressedData,
        saveVersion: backup.saveVersion,
        lastModifiedAt: new Date(),
        metadata: {
          slotId: backup.slotId,
          slotName: `Restored Save (Slot ${backup.slotId})`,
          saveType: SaveType.MANUAL,
          playtime: 0,
        },
      });
    }

    return this.saveGameRepo.save(saveGame);
  }

  async deleteBackup(backupId: string, userId: string): Promise<void> {
    const result = await this.backupRepo.delete({ id: backupId, userId });
    if (result.affected === 0) {
      throw new Error('Backup not found');
    }
  }

  private async cleanupOldBackups(userId: string, slotId: number): Promise<void> {
    // Get backups for this slot, ordered by creation date
    const backups = await this.backupRepo.find({
      where: { userId, slotId },
      order: { createdAt: 'DESC' },
    });

    // Keep only MAX_BACKUPS_PER_SLOT, delete the rest
    if (backups.length > this.MAX_BACKUPS_PER_SLOT) {
      const toDelete = backups.slice(this.MAX_BACKUPS_PER_SLOT);
      const idsToDelete = toDelete.map((b) => b.id);

      await this.backupRepo.delete(idsToDelete);
      this.logger.debug(
        `Cleaned up ${idsToDelete.length} old backups for user ${userId}, slot ${slotId}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredBackups(): Promise<void> {
    this.logger.log('Running scheduled backup cleanup');

    const result = await this.backupRepo.delete({
      expiresAt: LessThan(new Date()),
    });

    this.logger.log(`Cleaned up ${result.affected} expired backups`);
  }
}
