import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaveGame } from '../entities/save-game.entity';
import { BackupReason } from '../entities/save-game-backup.entity';
import {
  SyncStatus,
  ConflictResolution,
  CloudSyncResult,
  ConflictDetails,
  SaveGameData,
  SaveGameSummary,
  SaveType,
} from '../interfaces/save-game.interfaces';
import { SyncSaveGameDto, ResolveConflictDto, BatchSyncDto } from '../dto/sync-save-game.dto';
import { SaveCompressionService } from './save-compression.service';
import { SaveEncryptionService } from './save-encryption.service';
import { SaveVersioningService } from './save-versioning.service';
import { SaveBackupService } from './save-backup.service';
import { SaveAnalyticsService } from './save-analytics.service';

@Injectable()
export class CloudSyncService {
  private readonly logger = new Logger(CloudSyncService.name);

  // Time threshold for considering saves as concurrent (in milliseconds)
  private readonly CONFLICT_THRESHOLD_MS = 60000; // 1 minute

  constructor(
    @InjectRepository(SaveGame)
    private readonly saveGameRepo: Repository<SaveGame>,
    private readonly compressionService: SaveCompressionService,
    private readonly encryptionService: SaveEncryptionService,
    private readonly versioningService: SaveVersioningService,
    private readonly backupService: SaveBackupService,
    private readonly analyticsService: SaveAnalyticsService,
  ) {}

  async syncSave(userId: string, dto: SyncSaveGameDto): Promise<CloudSyncResult> {
    const cloudSave = await this.saveGameRepo.findOne({
      where: { userId, slotId: dto.slotId },
    });

    // No cloud save exists - client should upload
    if (!cloudSave) {
      return {
        success: true,
        syncStatus: SyncStatus.LOCAL_ONLY,
      };
    }

    // Check sync status
    const syncResult = this.determineSyncStatus(cloudSave, dto);

    // Record analytics
    await this.analyticsService.recordSync(userId, syncResult.syncStatus === SyncStatus.CONFLICT);

    return syncResult;
  }

  private determineSyncStatus(
    cloudSave: SaveGame,
    localInfo: SyncSaveGameDto,
  ): CloudSyncResult {
    const cloudSummary = this.toSummary(cloudSave);

    // No local data provided - just return cloud state
    if (!localInfo.localChecksum && !localInfo.lastModifiedAt) {
      return {
        success: true,
        syncStatus: SyncStatus.CLOUD_ONLY,
        cloudSave: cloudSummary,
      };
    }

    // Check if checksums match (saves are identical)
    if (localInfo.localChecksum === cloudSave.checksum?.value) {
      return {
        success: true,
        syncStatus: SyncStatus.SYNCED,
        cloudSave: cloudSummary,
      };
    }

    // Compare timestamps
    const localModified = localInfo.lastModifiedAt
      ? new Date(localInfo.lastModifiedAt)
      : null;
    const cloudModified = cloudSave.lastModifiedAt;

    // If local has no timestamp, cloud is newer
    if (!localModified) {
      return {
        success: true,
        syncStatus: SyncStatus.CLOUD_NEWER,
        cloudSave: cloudSummary,
      };
    }

    const timeDiff = Math.abs(localModified.getTime() - cloudModified.getTime());

    // Check for conflict (both modified within threshold)
    if (timeDiff < this.CONFLICT_THRESHOLD_MS) {
      return {
        success: false,
        syncStatus: SyncStatus.CONFLICT,
        cloudSave: cloudSummary,
        conflictDetails: {
          localLastModified: localModified,
          cloudLastModified: cloudModified,
          localChecksum: localInfo.localChecksum || '',
          cloudChecksum: cloudSave.checksum?.value || '',
          suggestedResolution: this.suggestResolution(localModified, cloudModified),
        },
      };
    }

    // Determine which is newer
    if (localModified > cloudModified) {
      return {
        success: true,
        syncStatus: SyncStatus.LOCAL_NEWER,
        cloudSave: cloudSummary,
      };
    }

    return {
      success: true,
      syncStatus: SyncStatus.CLOUD_NEWER,
      cloudSave: cloudSummary,
    };
  }

  private suggestResolution(localModified: Date, cloudModified: Date): ConflictResolution {
    // If one is significantly more recent, suggest using it
    if (localModified > cloudModified) {
      return ConflictResolution.USE_LOCAL;
    }
    return ConflictResolution.USE_CLOUD;
  }

  async resolveConflict(userId: string, dto: ResolveConflictDto): Promise<SaveGame> {
    const cloudSave = await this.saveGameRepo.findOne({
      where: { id: dto.saveId, userId },
    });

    if (!cloudSave) {
      throw new BadRequestException('Save not found');
    }

    // Create backup of cloud version before resolution
    await this.backupService.createBackup(cloudSave, BackupReason.CONFLICT);

    switch (dto.resolution) {
      case ConflictResolution.USE_CLOUD:
        // Keep cloud version, just update sync status
        cloudSave.syncStatus = SyncStatus.SYNCED;
        break;

      case ConflictResolution.USE_LOCAL:
        // Will be handled by upload - just mark as ready
        cloudSave.syncStatus = SyncStatus.LOCAL_NEWER;
        break;

      case ConflictResolution.USE_NEWEST:
        // Already determined by sync status
        cloudSave.syncStatus = SyncStatus.SYNCED;
        break;

      case ConflictResolution.MERGE:
        if (!dto.mergedData) {
          throw new BadRequestException('Merged data required for MERGE resolution');
        }
        await this.updateSaveData(cloudSave, dto.mergedData);
        cloudSave.syncStatus = SyncStatus.SYNCED;
        break;

      case ConflictResolution.KEEP_BOTH:
        // Create a new slot with the cloud version
        const newSlotId = await this.findNextEmptySlot(userId);
        const backupSave = this.saveGameRepo.create({
          ...cloudSave,
          id: undefined,
          slotId: newSlotId,
          slotName: `${cloudSave.slotName} (Cloud Backup)`,
          syncStatus: SyncStatus.SYNCED,
        });
        await this.saveGameRepo.save(backupSave);

        // Current slot will be overwritten by local
        cloudSave.syncStatus = SyncStatus.LOCAL_NEWER;
        break;
    }

    cloudSave.lastSyncedAt = new Date();
    const saved = await this.saveGameRepo.save(cloudSave);

    // Record conflict resolution
    await this.analyticsService.recordConflictResolved(userId);

    this.logger.log(
      `Resolved conflict for save ${dto.saveId} with resolution: ${dto.resolution}`,
    );

    return saved;
  }

  async uploadToCloud(
    userId: string,
    slotId: number,
    data: SaveGameData,
    deviceId?: string,
    platform?: string,
  ): Promise<SaveGame> {
    let cloudSave = await this.saveGameRepo.findOne({
      where: { userId, slotId },
    });

    // Validate data
    const validation = this.versioningService.validateDataStructure(data);
    if (!validation.valid) {
      throw new BadRequestException(`Invalid save data: ${validation.errors.join(', ')}`);
    }

    const saveData = this.versioningService.mergeWithDefaults(data);

    // Compress and encrypt
    const { compressedData, compressionInfo } =
      await this.compressionService.compress(saveData);
    const { encryptedData, encryptionInfo } =
      await this.encryptionService.encrypt(compressedData);

    const checksum = {
      algorithm: 'sha256' as const,
      value: this.encryptionService.generateChecksum(compressedData),
    };

    if (cloudSave) {
      // Update existing save
      cloudSave.compressedData = encryptedData;
      cloudSave.compressionInfo = compressionInfo;
      cloudSave.encryptionInfo = encryptionInfo;
      cloudSave.checksum = checksum;
      cloudSave.saveVersion++;
      cloudSave.lastModifiedAt = new Date();
      cloudSave.lastSyncedAt = new Date();
      cloudSave.syncStatus = SyncStatus.SYNCED;
      cloudSave.deviceId = deviceId || cloudSave.deviceId;
      cloudSave.platform = platform || cloudSave.platform;

      if (process.env.NODE_ENV === 'development') {
        cloudSave.rawData = saveData;
      }
    } else {
      // Create new cloud save
      cloudSave = this.saveGameRepo.create({
        userId,
        slotId,
        slotName: `Save Slot ${slotId}`,
        version: this.versioningService.CURRENT_VERSION,
        saveVersion: 1,
        metadata: {
          slotId,
          slotName: `Save Slot ${slotId}`,
          saveType: SaveType.MANUAL,
          playtime: 0,
        },
        compressedData: encryptedData,
        rawData: process.env.NODE_ENV === 'development' ? saveData : null,
        checksum,
        compressionInfo,
        encryptionInfo,
        syncStatus: SyncStatus.SYNCED,
        lastModifiedAt: new Date(),
        lastSyncedAt: new Date(),
        deviceId,
        platform,
      });
    }

    return this.saveGameRepo.save(cloudSave);
  }

  async downloadFromCloud(userId: string, slotId: number): Promise<{
    data: SaveGameData;
    metadata: SaveGameSummary;
  }> {
    const cloudSave = await this.saveGameRepo.findOne({
      where: { userId, slotId },
    });

    if (!cloudSave) {
      throw new BadRequestException(`No cloud save found for slot ${slotId}`);
    }

    if (cloudSave.isCorrupted) {
      throw new BadRequestException('Cloud save is corrupted');
    }

    // Decrypt and decompress
    const decryptedData = await this.encryptionService.decrypt(
      cloudSave.compressedData,
      cloudSave.encryptionInfo,
    );

    // Verify checksum
    if (!this.encryptionService.verifyChecksum(decryptedData, cloudSave.checksum.value)) {
      throw new BadRequestException('Cloud save data corrupted - checksum mismatch');
    }

    const saveData = await this.compressionService.decompress(
      decryptedData,
      cloudSave.compressionInfo,
    );

    // Migrate if needed
    const migratedData = this.versioningService.migrateToCurrentVersion(saveData);

    // Update sync status
    cloudSave.syncStatus = SyncStatus.SYNCED;
    cloudSave.lastSyncedAt = new Date();
    await this.saveGameRepo.save(cloudSave);

    return {
      data: migratedData,
      metadata: this.toSummary(cloudSave),
    };
  }

  async batchSync(userId: string, dto: BatchSyncDto): Promise<CloudSyncResult[]> {
    const results: CloudSyncResult[] = [];

    for (const save of dto.saves) {
      const result = await this.syncSave(userId, {
        ...save,
        deviceId: dto.deviceId || save.deviceId,
      });
      results.push(result);
    }

    return results;
  }

  async getCloudSaves(userId: string): Promise<SaveGameSummary[]> {
    const saves = await this.saveGameRepo.find({
      where: { userId },
      order: { slotId: 'ASC' },
    });

    return saves.map((save) => this.toSummary(save));
  }

  private async updateSaveData(save: SaveGame, data: SaveGameData): Promise<void> {
    const saveData = this.versioningService.mergeWithDefaults(data);

    const { compressedData, compressionInfo } =
      await this.compressionService.compress(saveData);
    const { encryptedData, encryptionInfo } =
      await this.encryptionService.encrypt(compressedData);

    save.compressedData = encryptedData;
    save.compressionInfo = compressionInfo;
    save.encryptionInfo = encryptionInfo;
    save.checksum = {
      algorithm: 'sha256',
      value: this.encryptionService.generateChecksum(compressedData),
    };
    save.saveVersion++;
    save.lastModifiedAt = new Date();

    if (process.env.NODE_ENV === 'development') {
      save.rawData = saveData;
    }
  }

  private async findNextEmptySlot(userId: string): Promise<number> {
    const usedSlots = await this.saveGameRepo
      .createQueryBuilder('save')
      .select('save.slotId')
      .where('save.userId = :userId', { userId })
      .getMany();

    const usedSlotIds = new Set(usedSlots.map((s) => s.slotId));

    for (let i = 0; i < 100; i++) {
      if (!usedSlotIds.has(i)) {
        return i;
      }
    }

    throw new BadRequestException('No empty save slots available');
  }

  private toSummary(save: SaveGame): SaveGameSummary {
    return {
      id: save.id,
      slotId: save.slotId,
      slotName: save.slotName,
      version: save.saveVersion,
      checksum: save.checksum?.value || '',
      lastModifiedAt: save.lastModifiedAt,
      playtime: save.metadata?.playtime || 0,
      isCompressed: save.compressionInfo?.algorithm !== 'none',
      isEncrypted: !!save.encryptionInfo,
    };
  }
}
