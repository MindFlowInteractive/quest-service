import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { CloudSyncService } from './cloud-sync.service';
import { SaveGame } from '../entities/save-game.entity';
import { SaveCompressionService } from './save-compression.service';
import { SaveEncryptionService } from './save-encryption.service';
import { SaveVersioningService } from './save-versioning.service';
import { SaveBackupService } from './save-backup.service';
import { SaveAnalyticsService } from './save-analytics.service';
import {
  SyncStatus,
  SaveType,
  ConflictResolution,
} from '../interfaces/save-game.interfaces';

describe('CloudSyncService', () => {
  let service: CloudSyncService;
  let saveGameRepo: jest.Mocked<Repository<SaveGame>>;
  let compressionService: jest.Mocked<SaveCompressionService>;
  let encryptionService: jest.Mocked<SaveEncryptionService>;
  let versioningService: jest.Mocked<SaveVersioningService>;
  let backupService: jest.Mocked<SaveBackupService>;
  let analyticsService: jest.Mocked<SaveAnalyticsService>;

  const mockUserId = 'user-123';
  const mockSaveGame: Partial<SaveGame> = {
    id: 'save-123',
    userId: mockUserId,
    slotId: 0,
    slotName: 'Test Save',
    saveType: SaveType.MANUAL,
    version: 1,
    saveVersion: 1,
    metadata: {
      slotId: 0,
      slotName: 'Test Save',
      saveType: SaveType.MANUAL,
      playtime: 100,
    },
    compressedData: Buffer.from('test'),
    checksum: { algorithm: 'sha256', value: 'abc123' },
    compressionInfo: { algorithm: 'gzip', originalSize: 100, compressedSize: 50 },
    encryptionInfo: { algorithm: 'aes-256-gcm', iv: 'iv', tag: 'tag' },
    syncStatus: SyncStatus.SYNCED,
    lastModifiedAt: new Date(),
    lastSyncedAt: new Date(),
    isCorrupted: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudSyncService,
        {
          provide: getRepositoryToken(SaveGame),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: SaveCompressionService,
          useValue: {
            compress: jest.fn(),
            decompress: jest.fn(),
          },
        },
        {
          provide: SaveEncryptionService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
            generateChecksum: jest.fn(),
            verifyChecksum: jest.fn(),
          },
        },
        {
          provide: SaveVersioningService,
          useValue: {
            CURRENT_VERSION: 1,
            validateDataStructure: jest.fn(),
            mergeWithDefaults: jest.fn(),
            migrateToCurrentVersion: jest.fn(),
          },
        },
        {
          provide: SaveBackupService,
          useValue: {
            createBackup: jest.fn(),
          },
        },
        {
          provide: SaveAnalyticsService,
          useValue: {
            recordSync: jest.fn(),
            recordConflictResolved: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CloudSyncService>(CloudSyncService);
    saveGameRepo = module.get(getRepositoryToken(SaveGame));
    compressionService = module.get(SaveCompressionService);
    encryptionService = module.get(SaveEncryptionService);
    versioningService = module.get(SaveVersioningService);
    backupService = module.get(SaveBackupService);
    analyticsService = module.get(SaveAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncSave', () => {
    it('should return LOCAL_ONLY if no cloud save exists', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);

      const result = await service.syncSave(mockUserId, { slotId: 0 });

      expect(result.success).toBe(true);
      expect(result.syncStatus).toBe(SyncStatus.LOCAL_ONLY);
    });

    it('should return CLOUD_ONLY if no local info provided', async () => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);

      const result = await service.syncSave(mockUserId, { slotId: 0 });

      expect(result.success).toBe(true);
      expect(result.syncStatus).toBe(SyncStatus.CLOUD_ONLY);
      expect(result.cloudSave).toBeDefined();
    });

    it('should return SYNCED if checksums match', async () => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);

      const result = await service.syncSave(mockUserId, {
        slotId: 0,
        localChecksum: 'abc123',
      });

      expect(result.success).toBe(true);
      expect(result.syncStatus).toBe(SyncStatus.SYNCED);
    });

    it('should return LOCAL_NEWER if local is more recent', async () => {
      const oldCloudSave = {
        ...mockSaveGame,
        lastModifiedAt: new Date(Date.now() - 3600000), // 1 hour ago
      };
      saveGameRepo.findOne.mockResolvedValue(oldCloudSave as SaveGame);

      const result = await service.syncSave(mockUserId, {
        slotId: 0,
        localChecksum: 'different',
        lastModifiedAt: new Date(), // Now
      });

      expect(result.success).toBe(true);
      expect(result.syncStatus).toBe(SyncStatus.LOCAL_NEWER);
    });

    it('should return CLOUD_NEWER if cloud is more recent', async () => {
      const recentCloudSave = {
        ...mockSaveGame,
        lastModifiedAt: new Date(),
      };
      saveGameRepo.findOne.mockResolvedValue(recentCloudSave as SaveGame);

      const result = await service.syncSave(mockUserId, {
        slotId: 0,
        localChecksum: 'different',
        lastModifiedAt: new Date(Date.now() - 3600000), // 1 hour ago
      });

      expect(result.success).toBe(true);
      expect(result.syncStatus).toBe(SyncStatus.CLOUD_NEWER);
    });

    it('should detect CONFLICT for concurrent modifications', async () => {
      const now = Date.now();
      const cloudSave = {
        ...mockSaveGame,
        lastModifiedAt: new Date(now - 30000), // 30 seconds ago
      };
      saveGameRepo.findOne.mockResolvedValue(cloudSave as SaveGame);

      const result = await service.syncSave(mockUserId, {
        slotId: 0,
        localChecksum: 'different',
        lastModifiedAt: new Date(now), // Now
      });

      expect(result.success).toBe(false);
      expect(result.syncStatus).toBe(SyncStatus.CONFLICT);
      expect(result.conflictDetails).toBeDefined();
    });

    it('should record analytics', async () => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);

      await service.syncSave(mockUserId, { slotId: 0 });

      expect(analyticsService.recordSync).toHaveBeenCalled();
    });
  });

  describe('resolveConflict', () => {
    beforeEach(() => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      saveGameRepo.save.mockResolvedValue(mockSaveGame as SaveGame);
    });

    it('should resolve with USE_CLOUD', async () => {
      const result = await service.resolveConflict(mockUserId, {
        saveId: 'save-123',
        resolution: ConflictResolution.USE_CLOUD,
      });

      expect(backupService.createBackup).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(analyticsService.recordConflictResolved).toHaveBeenCalled();
    });

    it('should resolve with USE_LOCAL', async () => {
      const result = await service.resolveConflict(mockUserId, {
        saveId: 'save-123',
        resolution: ConflictResolution.USE_LOCAL,
      });

      expect(result).toBeDefined();
    });

    it('should resolve with MERGE when merged data provided', async () => {
      versioningService.mergeWithDefaults.mockReturnValue({
        version: 1,
        gameState: {},
        playerState: {},
        progressState: {},
      });
      compressionService.compress.mockResolvedValue({
        compressedData: Buffer.from('merged'),
        compressionInfo: { algorithm: 'gzip', originalSize: 100, compressedSize: 50 },
      });
      encryptionService.encrypt.mockResolvedValue({
        encryptedData: Buffer.from('encrypted'),
        encryptionInfo: { algorithm: 'aes-256-gcm', iv: 'iv', tag: 'tag' },
      });
      encryptionService.generateChecksum.mockReturnValue('checksum');

      const result = await service.resolveConflict(mockUserId, {
        saveId: 'save-123',
        resolution: ConflictResolution.MERGE,
        mergedData: {
          version: 1,
          gameState: { merged: true },
          playerState: {},
          progressState: {},
        },
      });

      expect(result).toBeDefined();
    });

    it('should throw if MERGE without merged data', async () => {
      await expect(
        service.resolveConflict(mockUserId, {
          saveId: 'save-123',
          resolution: ConflictResolution.MERGE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if save not found', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resolveConflict(mockUserId, {
          saveId: 'nonexistent',
          resolution: ConflictResolution.USE_CLOUD,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadToCloud', () => {
    const saveData = {
      version: 1,
      gameState: { level: 1 },
      playerState: { health: 100 },
      progressState: { completedLevels: [] },
    };

    beforeEach(() => {
      versioningService.validateDataStructure.mockReturnValue({ valid: true, errors: [] });
      versioningService.mergeWithDefaults.mockReturnValue(saveData);
      compressionService.compress.mockResolvedValue({
        compressedData: Buffer.from('compressed'),
        compressionInfo: { algorithm: 'gzip', originalSize: 100, compressedSize: 50 },
      });
      encryptionService.encrypt.mockResolvedValue({
        encryptedData: Buffer.from('encrypted'),
        encryptionInfo: { algorithm: 'aes-256-gcm', iv: 'iv', tag: 'tag' },
      });
      encryptionService.generateChecksum.mockReturnValue('checksum');
      saveGameRepo.save.mockResolvedValue(mockSaveGame as SaveGame);
    });

    it('should create new cloud save', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);
      saveGameRepo.create.mockReturnValue(mockSaveGame as SaveGame);

      const result = await service.uploadToCloud(mockUserId, 0, saveData);

      expect(saveGameRepo.create).toHaveBeenCalled();
      expect(saveGameRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update existing cloud save', async () => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);

      const result = await service.uploadToCloud(mockUserId, 0, saveData);

      expect(saveGameRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw on invalid data', async () => {
      versioningService.validateDataStructure.mockReturnValue({
        valid: false,
        errors: ['Invalid'],
      });

      await expect(service.uploadToCloud(mockUserId, 0, saveData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('downloadFromCloud', () => {
    beforeEach(() => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      encryptionService.decrypt.mockResolvedValue(Buffer.from('decrypted'));
      encryptionService.verifyChecksum.mockReturnValue(true);
      compressionService.decompress.mockResolvedValue({
        version: 1,
        gameState: {},
        playerState: {},
        progressState: {},
      });
      versioningService.migrateToCurrentVersion.mockReturnValue({
        version: 1,
        gameState: {},
        playerState: {},
        progressState: {},
      });
      saveGameRepo.save.mockResolvedValue(mockSaveGame as SaveGame);
    });

    it('should download and decrypt cloud save', async () => {
      const result = await service.downloadFromCloud(mockUserId, 0);

      expect(encryptionService.decrypt).toHaveBeenCalled();
      expect(compressionService.decompress).toHaveBeenCalled();
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should throw if no cloud save found', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);

      await expect(service.downloadFromCloud(mockUserId, 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if save is corrupted', async () => {
      saveGameRepo.findOne.mockResolvedValue({
        ...mockSaveGame,
        isCorrupted: true,
      } as SaveGame);

      await expect(service.downloadFromCloud(mockUserId, 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if checksum fails', async () => {
      encryptionService.verifyChecksum.mockReturnValue(false);

      await expect(service.downloadFromCloud(mockUserId, 0)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCloudSaves', () => {
    it('should return all cloud saves for user', async () => {
      saveGameRepo.find.mockResolvedValue([mockSaveGame as SaveGame]);

      const result = await service.getCloudSaves(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].slotId).toBe(0);
    });
  });

  describe('batchSync', () => {
    it('should sync multiple saves', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);

      const result = await service.batchSync(mockUserId, {
        saves: [{ slotId: 0 }, { slotId: 1 }, { slotId: 2 }],
      });

      expect(result).toHaveLength(3);
      expect(analyticsService.recordSync).toHaveBeenCalledTimes(3);
    });
  });
});
