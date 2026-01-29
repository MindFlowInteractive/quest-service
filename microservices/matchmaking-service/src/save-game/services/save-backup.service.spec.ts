import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { SaveBackupService } from './save-backup.service';
import { SaveGameBackup, BackupReason } from '../entities/save-game-backup.entity';
import { SaveGame } from '../entities/save-game.entity';
import { SaveCompressionService } from './save-compression.service';
import { SaveEncryptionService } from './save-encryption.service';
import { SaveType, SyncStatus } from '../interfaces/save-game.interfaces';

describe('SaveBackupService', () => {
  let service: SaveBackupService;
  let backupRepo: jest.Mocked<Repository<SaveGameBackup>>;
  let saveGameRepo: jest.Mocked<Repository<SaveGame>>;
  let encryptionService: jest.Mocked<SaveEncryptionService>;

  const mockUserId = 'user-123';
  const mockSaveGame: Partial<SaveGame> = {
    id: 'save-123',
    userId: mockUserId,
    slotId: 0,
    slotName: 'Test Save',
    saveType: SaveType.MANUAL,
    version: 1,
    saveVersion: 5,
    metadata: {
      slotId: 0,
      slotName: 'Test Save',
      saveType: SaveType.MANUAL,
      playtime: 3600,
    },
    compressedData: Buffer.from('test-compressed-data'),
    checksum: { algorithm: 'sha256', value: 'abc123' },
    compressionInfo: { algorithm: 'gzip', originalSize: 100, compressedSize: 50 },
    encryptionInfo: { algorithm: 'aes-256-gcm', iv: 'iv', tag: 'tag' },
    syncStatus: SyncStatus.LOCAL_ONLY,
    lastModifiedAt: new Date(),
    isCorrupted: false,
  };

  const mockBackup: Partial<SaveGameBackup> = {
    id: 'backup-123',
    saveGameId: 'save-123',
    userId: mockUserId,
    slotId: 0,
    saveVersion: 5,
    reason: BackupReason.PRE_UPDATE,
    compressedData: Buffer.from('test-compressed-data'),
    checksum: 'checksum-123',
    dataSize: 20,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveBackupService,
        {
          provide: getRepositoryToken(SaveGameBackup),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SaveGame),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
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
      ],
    }).compile();

    service = module.get<SaveBackupService>(SaveBackupService);
    backupRepo = module.get(getRepositoryToken(SaveGameBackup));
    saveGameRepo = module.get(getRepositoryToken(SaveGame));
    encryptionService = module.get(SaveEncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBackup', () => {
    beforeEach(() => {
      encryptionService.generateChecksum.mockReturnValue('checksum-123');
      backupRepo.create.mockReturnValue(mockBackup as SaveGameBackup);
      backupRepo.save.mockResolvedValue(mockBackup as SaveGameBackup);
      backupRepo.find.mockResolvedValue([]);
      backupRepo.delete.mockResolvedValue({ affected: 0 } as DeleteResult);
    });

    it('should create a backup with PRE_UPDATE reason', async () => {
      const result = await service.createBackup(
        mockSaveGame as SaveGame,
        BackupReason.PRE_UPDATE,
      );

      expect(encryptionService.generateChecksum).toHaveBeenCalledWith(
        mockSaveGame.compressedData,
      );
      expect(backupRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          saveGameId: mockSaveGame.id,
          userId: mockSaveGame.userId,
          slotId: mockSaveGame.slotId,
          saveVersion: mockSaveGame.saveVersion,
          reason: BackupReason.PRE_UPDATE,
        }),
      );
      expect(backupRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockBackup);
    });

    it('should create backup with correct retention for MANUAL reason', async () => {
      await service.createBackup(mockSaveGame as SaveGame, BackupReason.MANUAL);

      expect(backupRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: BackupReason.MANUAL,
          expiresAt: expect.any(Date),
        }),
      );

      const createCall = backupRepo.create.mock.calls[0][0] as { expiresAt: Date };
      const expiresAt = new Date(createCall.expiresAt.getTime());
      const now = new Date();
      const daysDiff = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      // MANUAL retention is 90 days
      expect(daysDiff).toBeGreaterThanOrEqual(89);
      expect(daysDiff).toBeLessThanOrEqual(91);
    });

    it('should create backup with correct retention for CONFLICT reason', async () => {
      await service.createBackup(mockSaveGame as SaveGame, BackupReason.CONFLICT);

      const createCall = backupRepo.create.mock.calls[0][0] as { expiresAt: Date };
      const expiresAt = new Date(createCall.expiresAt.getTime());
      const now = new Date();
      const daysDiff = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      // CONFLICT retention is 30 days
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });

    it('should cleanup old backups after creating new one', async () => {
      const oldBackups = Array(15)
        .fill(null)
        .map((_, i) => ({
          ...mockBackup,
          id: `backup-${i}`,
          createdAt: new Date(Date.now() - i * 1000),
        }));
      backupRepo.find.mockResolvedValue(oldBackups as SaveGameBackup[]);

      await service.createBackup(mockSaveGame as SaveGame, BackupReason.PRE_UPDATE);

      // Should delete backups beyond MAX_BACKUPS_PER_SLOT (10)
      expect(backupRepo.delete).toHaveBeenCalled();
    });
  });

  describe('getBackups', () => {
    it('should return all backups for user', async () => {
      const backups = [mockBackup as SaveGameBackup];
      backupRepo.find.mockResolvedValue(backups);

      const result = await service.getBackups(mockUserId);

      expect(backupRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(backups);
    });

    it('should filter by slotId when provided', async () => {
      const backups = [mockBackup as SaveGameBackup];
      backupRepo.find.mockResolvedValue(backups);

      const result = await service.getBackups(mockUserId, 0);

      expect(backupRepo.find).toHaveBeenCalledWith({
        where: { userId: mockUserId, slotId: 0 },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(backups);
    });
  });

  describe('restoreFromBackup', () => {
    beforeEach(() => {
      backupRepo.findOne.mockResolvedValue(mockBackup as SaveGameBackup);
      encryptionService.generateChecksum.mockReturnValue('checksum-123');
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      saveGameRepo.save.mockResolvedValue(mockSaveGame as SaveGame);
      backupRepo.create.mockReturnValue(mockBackup as SaveGameBackup);
      backupRepo.save.mockResolvedValue(mockBackup as SaveGameBackup);
      backupRepo.find.mockResolvedValue([]);
    });

    it('should restore save from backup when save exists', async () => {
      const result = await service.restoreFromBackup('backup-123', mockUserId);

      expect(backupRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'backup-123', userId: mockUserId },
      });
      expect(encryptionService.generateChecksum).toHaveBeenCalledWith(
        mockBackup.compressedData,
      );
      expect(saveGameRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should create new save if original does not exist', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);
      saveGameRepo.create.mockReturnValue(mockSaveGame as SaveGame);

      await service.restoreFromBackup('backup-123', mockUserId);

      expect(saveGameRepo.create).toHaveBeenCalled();
      expect(saveGameRepo.save).toHaveBeenCalled();
    });

    it('should throw if backup not found', async () => {
      backupRepo.findOne.mockResolvedValue(null);

      await expect(service.restoreFromBackup('backup-123', mockUserId)).rejects.toThrow(
        'Backup not found',
      );
    });

    it('should throw if backup checksum does not match', async () => {
      encryptionService.generateChecksum.mockReturnValue('different-checksum');

      await expect(service.restoreFromBackup('backup-123', mockUserId)).rejects.toThrow(
        'Backup data corrupted - checksum mismatch',
      );
    });

    it('should clear corruption flags on restore', async () => {
      const corruptedSave = {
        ...mockSaveGame,
        isCorrupted: true,
        corruptionReason: 'Test corruption',
      };
      saveGameRepo.findOne.mockResolvedValue(corruptedSave as SaveGame);

      await service.restoreFromBackup('backup-123', mockUserId);

      expect(saveGameRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isCorrupted: false,
          corruptionReason: null,
        }),
      );
    });
  });

  describe('deleteBackup', () => {
    it('should delete backup', async () => {
      backupRepo.delete.mockResolvedValue({ affected: 1 } as DeleteResult);

      await expect(
        service.deleteBackup('backup-123', mockUserId),
      ).resolves.not.toThrow();

      expect(backupRepo.delete).toHaveBeenCalledWith({
        id: 'backup-123',
        userId: mockUserId,
      });
    });

    it('should throw if backup not found', async () => {
      backupRepo.delete.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(service.deleteBackup('backup-123', mockUserId)).rejects.toThrow(
        'Backup not found',
      );
    });
  });

  describe('cleanupExpiredBackups', () => {
    it('should delete expired backups', async () => {
      backupRepo.delete.mockResolvedValue({ affected: 5 } as DeleteResult);

      await service.cleanupExpiredBackups();

      expect(backupRepo.delete).toHaveBeenCalledWith({
        expiresAt: expect.anything(),
      });
    });
  });
});
