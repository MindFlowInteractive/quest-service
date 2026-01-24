import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaveGame } from '../entities/save-game.entity';
import { BackupReason } from '../entities/save-game-backup.entity';
import { CreateSaveGameDto } from '../dto/create-save-game.dto';
import { UpdateSaveGameDto } from '../dto/update-save-game.dto';
import {
  SaveGameData,
  SaveType,
  SyncStatus,
  SaveGameMetadata,
  SaveGameSummary,
} from '../interfaces/save-game.interfaces';
import { SaveCompressionService } from './save-compression.service';
import { SaveEncryptionService } from './save-encryption.service';
import { SaveVersioningService } from './save-versioning.service';
import { SaveBackupService } from './save-backup.service';
import { SaveAnalyticsService } from './save-analytics.service';

@Injectable()
export class SaveGameService {
  private readonly logger = new Logger(SaveGameService.name);
  private readonly MAX_SLOTS = 100;

  constructor(
    @InjectRepository(SaveGame)
    private readonly saveGameRepo: Repository<SaveGame>,
    private readonly compressionService: SaveCompressionService,
    private readonly encryptionService: SaveEncryptionService,
    private readonly versioningService: SaveVersioningService,
    private readonly backupService: SaveBackupService,
    private readonly analyticsService: SaveAnalyticsService,
  ) {}

  async create(userId: string, dto: CreateSaveGameDto): Promise<SaveGame> {
    // Validate slot ID
    if (dto.slotId < 0 || dto.slotId >= this.MAX_SLOTS) {
      throw new BadRequestException(`Slot ID must be between 0 and ${this.MAX_SLOTS - 1}`);
    }

    // Check if slot already exists
    const existingSave = await this.saveGameRepo.findOne({
      where: { userId, slotId: dto.slotId },
    });

    if (existingSave) {
      throw new BadRequestException(`Save slot ${dto.slotId} already exists. Use update instead.`);
    }

    // Validate and process save data
    const validation = this.versioningService.validateDataStructure(dto.data);
    if (!validation.valid) {
      throw new BadRequestException(`Invalid save data: ${validation.errors.join(', ')}`);
    }

    // Merge with defaults and ensure current version
    const saveData = this.versioningService.mergeWithDefaults(dto.data);

    // Compress the data
    const { compressedData, compressionInfo } = await this.compressionService.compress(saveData);

    // Encrypt the compressed data
    const { encryptedData, encryptionInfo } = await this.encryptionService.encrypt(compressedData);

    // Generate checksum
    const checksum = {
      algorithm: 'sha256' as const,
      value: this.encryptionService.generateChecksum(compressedData),
    };

    // Build metadata
    const metadata: SaveGameMetadata = {
      slotId: dto.slotId,
      slotName: dto.slotName || `Save Slot ${dto.slotId}`,
      saveType: dto.saveType || SaveType.MANUAL,
      playtime: dto.playtime || 0,
      customData: dto.customMetadata,
    };

    // Create the save game entity
    const saveGame = this.saveGameRepo.create({
      userId,
      slotId: dto.slotId,
      slotName: dto.slotName || `Save Slot ${dto.slotId}`,
      saveType: dto.saveType || SaveType.MANUAL,
      version: this.versioningService.CURRENT_VERSION,
      saveVersion: 1,
      metadata,
      compressedData: encryptedData,
      rawData: process.env.NODE_ENV === 'development' ? saveData : null,
      checksum,
      compressionInfo,
      encryptionInfo,
      syncStatus: SyncStatus.LOCAL_ONLY,
      lastModifiedAt: new Date(),
      deviceId: dto.deviceId,
      platform: dto.platform,
      saveCount: 1,
    });

    const saved = await this.saveGameRepo.save(saveGame);

    // Record analytics
    await this.analyticsService.recordSave(
      userId,
      dto.saveType || SaveType.MANUAL,
      encryptedData.length,
    );

    this.logger.log(`Created save game ${saved.id} for user ${userId} in slot ${dto.slotId}`);

    return saved;
  }

  async update(
    userId: string,
    slotId: number,
    dto: UpdateSaveGameDto,
  ): Promise<SaveGame> {
    const saveGame = await this.saveGameRepo.findOne({
      where: { userId, slotId },
    });

    if (!saveGame) {
      throw new NotFoundException(`Save slot ${slotId} not found`);
    }

    // Create backup before update
    await this.backupService.createBackup(saveGame, BackupReason.PRE_UPDATE);

    // Update metadata if provided
    if (dto.slotName) {
      saveGame.slotName = dto.slotName;
      saveGame.metadata.slotName = dto.slotName;
    }

    if (dto.playtime !== undefined) {
      saveGame.metadata.playtime = dto.playtime;
    }

    if (dto.customMetadata) {
      saveGame.metadata.customData = {
        ...saveGame.metadata.customData,
        ...dto.customMetadata,
      };
    }

    // Update save data if provided
    if (dto.data) {
      const validation = this.versioningService.validateDataStructure(dto.data);
      if (!validation.valid) {
        throw new BadRequestException(`Invalid save data: ${validation.errors.join(', ')}`);
      }

      const saveData = this.versioningService.mergeWithDefaults(dto.data);

      const { compressedData, compressionInfo } =
        await this.compressionService.compress(saveData);
      const { encryptedData, encryptionInfo } =
        await this.encryptionService.encrypt(compressedData);

      saveGame.compressedData = encryptedData;
      saveGame.compressionInfo = compressionInfo;
      saveGame.encryptionInfo = encryptionInfo;
      saveGame.checksum = {
        algorithm: 'sha256',
        value: this.encryptionService.generateChecksum(compressedData),
      };

      if (process.env.NODE_ENV === 'development') {
        saveGame.rawData = saveData;
      }
    }

    // Update tracking fields
    saveGame.saveVersion++;
    saveGame.saveCount++;
    saveGame.lastModifiedAt = new Date();
    saveGame.deviceId = dto.deviceId || saveGame.deviceId;
    saveGame.platform = dto.platform || saveGame.platform;
    saveGame.syncStatus = SyncStatus.LOCAL_NEWER;

    const updated = await this.saveGameRepo.save(saveGame);

    // Record analytics
    await this.analyticsService.recordSave(
      userId,
      saveGame.saveType,
      saveGame.compressedData?.length || 0,
    );

    return updated;
  }

  async findOne(userId: string, slotId: number): Promise<SaveGame> {
    const saveGame = await this.saveGameRepo.findOne({
      where: { userId, slotId },
    });

    if (!saveGame) {
      throw new NotFoundException(`Save slot ${slotId} not found`);
    }

    return saveGame;
  }

  async findAll(userId: string): Promise<SaveGameSummary[]> {
    const saves = await this.saveGameRepo.find({
      where: { userId },
      order: { slotId: 'ASC' },
    });

    return saves.map((save) => this.toSummary(save));
  }

  async load(userId: string, slotId: number): Promise<SaveGameData> {
    const saveGame = await this.findOne(userId, slotId);

    if (saveGame.isCorrupted) {
      throw new BadRequestException(
        `Save is corrupted: ${saveGame.corruptionReason}. Try restoring from backup.`,
      );
    }

    try {
      // Decrypt the data
      const decryptedData = await this.encryptionService.decrypt(
        saveGame.compressedData,
        saveGame.encryptionInfo,
      );

      // Verify checksum
      if (
        !this.encryptionService.verifyChecksum(decryptedData, saveGame.checksum.value)
      ) {
        await this.markCorrupted(saveGame, 'Checksum verification failed');
        throw new BadRequestException('Save data corrupted - checksum mismatch');
      }

      // Decompress the data
      const saveData = await this.compressionService.decompress(
        decryptedData,
        saveGame.compressionInfo,
      );

      // Migrate if necessary
      const migratedData = this.versioningService.migrateToCurrentVersion(saveData);

      // Update load count
      saveGame.loadCount++;
      await this.saveGameRepo.save(saveGame);

      // Record analytics
      await this.analyticsService.recordLoad(userId);

      return migratedData;
    } catch (error) {
      this.logger.error(`Failed to load save ${saveGame.id}: ${error.message}`);

      if (!saveGame.isCorrupted) {
        await this.markCorrupted(saveGame, error.message);
        await this.analyticsService.recordCorruption(userId);
      }

      throw error;
    }
  }

  async delete(userId: string, slotId: number): Promise<void> {
    const saveGame = await this.findOne(userId, slotId);

    // Create final backup before deletion
    await this.backupService.createBackup(saveGame, BackupReason.MANUAL);

    await this.saveGameRepo.remove(saveGame);
    this.logger.log(`Deleted save game slot ${slotId} for user ${userId}`);
  }

  async getEmptySlots(userId: string, count: number = 10): Promise<number[]> {
    const usedSlots = await this.saveGameRepo
      .createQueryBuilder('save')
      .select('save.slotId')
      .where('save.userId = :userId', { userId })
      .getMany();

    const usedSlotIds = new Set(usedSlots.map((s) => s.slotId));
    const emptySlots: number[] = [];

    for (let i = 0; i < this.MAX_SLOTS && emptySlots.length < count; i++) {
      if (!usedSlotIds.has(i)) {
        emptySlots.push(i);
      }
    }

    return emptySlots;
  }

  private async markCorrupted(saveGame: SaveGame, reason: string): Promise<void> {
    saveGame.isCorrupted = true;
    saveGame.corruptionReason = reason;
    await this.saveGameRepo.save(saveGame);

    // Try to create a backup for investigation
    try {
      await this.backupService.createBackup(saveGame, BackupReason.CORRUPTION_DETECTED);
    } catch {
      this.logger.warn(`Failed to create corruption backup for save ${saveGame.id}`);
    }
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
