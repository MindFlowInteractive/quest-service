import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SaveGameService } from './save-game.service';
import { SaveGame } from '../entities/save-game.entity';
import { SaveCompressionService } from './save-compression.service';
import { SaveEncryptionService } from './save-encryption.service';
import { SaveVersioningService } from './save-versioning.service';
import { SaveBackupService } from './save-backup.service';
import { SaveAnalyticsService } from './save-analytics.service';
import { SaveType, SyncStatus } from '../interfaces/save-game.interfaces';

describe('SaveGameService', () => {
  let service: SaveGameService;
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
    syncStatus: SyncStatus.LOCAL_ONLY,
    lastModifiedAt: new Date(),
    isCorrupted: false,
    loadCount: 0,
    saveCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveGameService,
        {
          provide: getRepositoryToken(SaveGame),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
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
            recordSave: jest.fn(),
            recordLoad: jest.fn(),
            recordCorruption: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SaveGameService>(SaveGameService);
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

  describe('create', () => {
    const createDto = {
      slotId: 0,
      slotName: 'My Save',
      saveType: SaveType.MANUAL,
      data: {
        version: 1,
        gameState: { level: 1 },
        playerState: { health: 100 },
        progressState: { completedLevels: [] },
      },
    };

    beforeEach(() => {
      saveGameRepo.findOne.mockResolvedValue(null);
      versioningService.validateDataStructure.mockReturnValue({ valid: true, errors: [] });
      versioningService.mergeWithDefaults.mockReturnValue(createDto.data);
      compressionService.compress.mockResolvedValue({
        compressedData: Buffer.from('compressed'),
        compressionInfo: { algorithm: 'gzip', originalSize: 100, compressedSize: 50 },
      });
      encryptionService.encrypt.mockResolvedValue({
        encryptedData: Buffer.from('encrypted'),
        encryptionInfo: { algorithm: 'aes-256-gcm', iv: 'iv', tag: 'tag' },
      });
      encryptionService.generateChecksum.mockReturnValue('checksum123');
      saveGameRepo.create.mockReturnValue(mockSaveGame as SaveGame);
      saveGameRepo.save.mockResolvedValue(mockSaveGame as SaveGame);
    });

    it('should create a new save game', async () => {
      const result = await service.create(mockUserId, createDto);

      expect(saveGameRepo.findOne).toHaveBeenCalledWith({
        where: { userId: mockUserId, slotId: createDto.slotId },
      });
      expect(versioningService.validateDataStructure).toHaveBeenCalled();
      expect(compressionService.compress).toHaveBeenCalled();
      expect(encryptionService.encrypt).toHaveBeenCalled();
      expect(saveGameRepo.save).toHaveBeenCalled();
      expect(analyticsService.recordSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw if slot already exists', async () => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if slot ID is out of range', async () => {
      await expect(
        service.create(mockUserId, { ...createDto, slotId: 100 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(mockUserId, { ...createDto, slotId: -1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if data validation fails', async () => {
      versioningService.validateDataStructure.mockReturnValue({
        valid: false,
        errors: ['Invalid data'],
      });

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a save game', async () => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);

      const result = await service.findOne(mockUserId, 0);

      expect(result).toEqual(mockSaveGame);
    });

    it('should throw NotFoundException if save not found', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, 0)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all saves for user', async () => {
      const saves = [mockSaveGame as SaveGame];
      saveGameRepo.find.mockResolvedValue(saves);

      const result = await service.findAll(mockUserId);

      expect(saveGameRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { slotId: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('load', () => {
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

    it('should load and decrypt save data', async () => {
      const result = await service.load(mockUserId, 0);

      expect(encryptionService.decrypt).toHaveBeenCalled();
      expect(encryptionService.verifyChecksum).toHaveBeenCalled();
      expect(compressionService.decompress).toHaveBeenCalled();
      expect(versioningService.migrateToCurrentVersion).toHaveBeenCalled();
      expect(analyticsService.recordLoad).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw if save is corrupted', async () => {
      const corruptedSave = { ...mockSaveGame, isCorrupted: true, corruptionReason: 'test' };
      saveGameRepo.findOne.mockResolvedValue(corruptedSave as SaveGame);

      await expect(service.load(mockUserId, 0)).rejects.toThrow(BadRequestException);
    });

    it('should throw and mark corrupted if checksum fails', async () => {
      encryptionService.verifyChecksum.mockReturnValue(false);

      await expect(service.load(mockUserId, 0)).rejects.toThrow(BadRequestException);
      expect(analyticsService.recordCorruption).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      slotName: 'Updated Save',
      data: {
        version: 1,
        gameState: { level: 2 },
        playerState: { health: 80 },
        progressState: { completedLevels: ['level1'] },
      },
    };

    beforeEach(() => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      versioningService.validateDataStructure.mockReturnValue({ valid: true, errors: [] });
      versioningService.mergeWithDefaults.mockReturnValue(updateDto.data);
      compressionService.compress.mockResolvedValue({
        compressedData: Buffer.from('compressed'),
        compressionInfo: { algorithm: 'gzip', originalSize: 100, compressedSize: 50 },
      });
      encryptionService.encrypt.mockResolvedValue({
        encryptedData: Buffer.from('encrypted'),
        encryptionInfo: { algorithm: 'aes-256-gcm', iv: 'iv', tag: 'tag' },
      });
      encryptionService.generateChecksum.mockReturnValue('checksum123');
      saveGameRepo.save.mockResolvedValue(mockSaveGame as SaveGame);
    });

    it('should update save game', async () => {
      const result = await service.update(mockUserId, 0, updateDto);

      expect(backupService.createBackup).toHaveBeenCalled();
      expect(saveGameRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw if save not found', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);

      await expect(service.update(mockUserId, 0, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      saveGameRepo.remove.mockResolvedValue(mockSaveGame as SaveGame);
    });

    it('should delete save game', async () => {
      await service.delete(mockUserId, 0);

      expect(backupService.createBackup).toHaveBeenCalled();
      expect(saveGameRepo.remove).toHaveBeenCalled();
    });

    it('should throw if save not found', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(mockUserId, 0)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEmptySlots', () => {
    it('should return empty slot IDs', async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ slotId: 0 }, { slotId: 2 }]),
      };
      saveGameRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getEmptySlots(mockUserId, 5);

      expect(result).toContain(1);
      expect(result).toContain(3);
      expect(result).toContain(4);
      expect(result).not.toContain(0);
      expect(result).not.toContain(2);
    });
  });
});
