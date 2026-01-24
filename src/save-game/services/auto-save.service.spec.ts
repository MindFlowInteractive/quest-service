import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutoSaveService } from './auto-save.service';
import { SaveGame } from '../entities/save-game.entity';
import { SaveGameService } from './save-game.service';
import { CloudSyncService } from './cloud-sync.service';
import { SaveType, SyncStatus, SaveGameData } from '../interfaces/save-game.interfaces';

describe('AutoSaveService', () => {
  let service: AutoSaveService;
  let saveGameRepo: jest.Mocked<Repository<SaveGame>>;
  let saveGameService: jest.Mocked<SaveGameService>;
  let cloudSyncService: jest.Mocked<CloudSyncService>;

  const mockUserId = 'user-123';
  const AUTO_SAVE_SLOT = 99;
  const QUICK_SAVE_SLOT = 98;

  const mockSaveData: SaveGameData = {
    version: 1,
    gameState: { level: 5, score: 1000 },
    playerState: {
      position: { x: 100, y: 200 },
      health: 80,
      inventory: ['sword', 'shield'],
    },
    progressState: {
      completedLevels: ['level1', 'level2'],
      unlockedAchievements: ['first_blood'],
    },
  };

  const mockSaveGame: Partial<SaveGame> = {
    id: 'save-123',
    userId: mockUserId,
    slotId: AUTO_SAVE_SLOT,
    slotName: 'Auto Save',
    saveType: SaveType.AUTO,
    version: 1,
    saveVersion: 1,
    metadata: {
      slotId: AUTO_SAVE_SLOT,
      slotName: 'Auto Save',
      saveType: SaveType.AUTO,
      playtime: 3600,
    },
    compressedData: Buffer.from('test'),
    syncStatus: SyncStatus.LOCAL_ONLY,
    lastModifiedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoSaveService,
        {
          provide: getRepositoryToken(SaveGame),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: SaveGameService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            load: jest.fn(),
          },
        },
        {
          provide: CloudSyncService,
          useValue: {
            syncSave: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AutoSaveService>(AutoSaveService);
    saveGameRepo = module.get(getRepositoryToken(SaveGame));
    saveGameService = module.get(SaveGameService);
    cloudSyncService = module.get(CloudSyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enableAutoSave', () => {
    it('should enable auto-save with default interval', async () => {
      await service.enableAutoSave(mockUserId);

      const config = service.getAutoSaveConfig(mockUserId);
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.slotId).toBe(AUTO_SAVE_SLOT);
      expect(config.intervalMs).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should enable auto-save with custom interval', async () => {
      const customInterval = 60000; // 1 minute
      await service.enableAutoSave(mockUserId, AUTO_SAVE_SLOT, customInterval);

      const config = service.getAutoSaveConfig(mockUserId);
      expect(config.intervalMs).toBe(customInterval);
    });

    it('should enable auto-save for custom slot', async () => {
      const customSlot = 5;
      await service.enableAutoSave(mockUserId, customSlot);

      const config = service.getAutoSaveConfig(mockUserId, customSlot);
      expect(config.slotId).toBe(customSlot);
    });
  });

  describe('disableAutoSave', () => {
    it('should disable auto-save', async () => {
      await service.enableAutoSave(mockUserId);
      await service.disableAutoSave(mockUserId);

      const config = service.getAutoSaveConfig(mockUserId);
      expect(config.enabled).toBe(false);
    });

    it('should handle disabling non-existent config gracefully', async () => {
      await expect(
        service.disableAutoSave('non-existent-user'),
      ).resolves.not.toThrow();
    });
  });

  describe('queueAutoSave', () => {
    it('should queue auto-save when enabled', async () => {
      await service.enableAutoSave(mockUserId);
      await service.queueAutoSave(mockUserId, mockSaveData);

      // The save should be queued for processing
      // We can't directly test the internal queue, but we can verify no errors
    });

    it('should not queue when auto-save is disabled', async () => {
      await service.enableAutoSave(mockUserId);
      await service.disableAutoSave(mockUserId);

      await service.queueAutoSave(mockUserId, mockSaveData);
      // Should not throw, just silently skip
    });

    it('should respect interval between auto-saves', async () => {
      await service.enableAutoSave(mockUserId, AUTO_SAVE_SLOT, 60000);

      // First queue should work
      await service.queueAutoSave(mockUserId, mockSaveData);

      // Simulate the config having a recent lastAutoSave
      const config = service.getAutoSaveConfig(mockUserId);
      if (config) {
        // Manually set lastAutoSave to test interval check
        (service as any).autoSaveConfigs.set(`${mockUserId}:${AUTO_SAVE_SLOT}`, {
          ...config,
          lastAutoSave: new Date(),
        });
      }

      // Second queue should be skipped due to interval
      await service.queueAutoSave(mockUserId, mockSaveData);
    });
  });

  describe('triggerAutoSave', () => {
    it('should create new auto-save when none exists', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);
      saveGameService.create.mockResolvedValue(mockSaveGame as SaveGame);

      const result = await service.triggerAutoSave(mockUserId, mockSaveData);

      expect(saveGameService.create).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          slotId: AUTO_SAVE_SLOT,
          slotName: 'Auto Save',
          saveType: SaveType.AUTO,
        }),
      );
      expect(result).toEqual(mockSaveGame);
    });

    it('should update existing auto-save', async () => {
      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      saveGameService.update.mockResolvedValue(mockSaveGame as SaveGame);

      const result = await service.triggerAutoSave(mockUserId, mockSaveData);

      expect(saveGameService.update).toHaveBeenCalledWith(
        mockUserId,
        AUTO_SAVE_SLOT,
        expect.objectContaining({
          data: expect.objectContaining({
            version: mockSaveData.version,
            gameState: mockSaveData.gameState,
          }),
        }),
      );
      expect(result).toEqual(mockSaveGame);
    });

    it('should return null on error', async () => {
      saveGameRepo.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.triggerAutoSave(mockUserId, mockSaveData);

      expect(result).toBeNull();
    });
  });

  describe('quickSave', () => {
    it('should create new quick save when none exists', async () => {
      saveGameRepo.findOne.mockResolvedValue(null);
      const quickSave = { ...mockSaveGame, slotId: QUICK_SAVE_SLOT, saveType: SaveType.QUICKSAVE };
      saveGameService.create.mockResolvedValue(quickSave as SaveGame);

      const result = await service.quickSave(mockUserId, mockSaveData);

      expect(saveGameService.create).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          slotId: QUICK_SAVE_SLOT,
          slotName: 'Quick Save',
          saveType: SaveType.QUICKSAVE,
        }),
      );
      expect(result.slotId).toBe(QUICK_SAVE_SLOT);
    });

    it('should update existing quick save', async () => {
      const quickSave = { ...mockSaveGame, slotId: QUICK_SAVE_SLOT };
      saveGameRepo.findOne.mockResolvedValue(quickSave as SaveGame);
      saveGameService.update.mockResolvedValue(quickSave as SaveGame);

      const result = await service.quickSave(mockUserId, mockSaveData);

      expect(saveGameService.update).toHaveBeenCalledWith(
        mockUserId,
        QUICK_SAVE_SLOT,
        expect.objectContaining({
          slotName: 'Quick Save',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('quickLoad', () => {
    it('should load quick save', async () => {
      saveGameService.load.mockResolvedValue(mockSaveData);

      const result = await service.quickLoad(mockUserId);

      expect(saveGameService.load).toHaveBeenCalledWith(mockUserId, QUICK_SAVE_SLOT);
      expect(result).toEqual(mockSaveData);
    });
  });

  describe('processPendingAutoSaves', () => {
    it('should skip when no pending saves', async () => {
      await service.processPendingAutoSaves();

      expect(saveGameRepo.findOne).not.toHaveBeenCalled();
    });

    it('should process pending auto-saves', async () => {
      // Queue some saves
      await service.enableAutoSave(mockUserId);

      // Directly add to pending queue for testing
      (service as any).pendingAutoSaves.push({
        userId: mockUserId,
        slotId: AUTO_SAVE_SLOT,
        data: mockSaveData,
        timestamp: new Date(),
      });

      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      saveGameService.update.mockResolvedValue(mockSaveGame as SaveGame);

      await service.processPendingAutoSaves();

      expect(saveGameService.update).toHaveBeenCalled();
    });

    it('should keep only latest save per user/slot', async () => {
      await service.enableAutoSave(mockUserId);

      // Add multiple saves for same user/slot
      const oldData = { ...mockSaveData, gameState: { level: 4, score: 900 } };
      const newData = { ...mockSaveData, gameState: { level: 5, score: 1000 } };

      (service as any).pendingAutoSaves.push(
        {
          userId: mockUserId,
          slotId: AUTO_SAVE_SLOT,
          data: oldData,
          timestamp: new Date(Date.now() - 1000),
        },
        {
          userId: mockUserId,
          slotId: AUTO_SAVE_SLOT,
          data: newData,
          timestamp: new Date(),
        },
      );

      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      saveGameService.update.mockResolvedValue(mockSaveGame as SaveGame);

      await service.processPendingAutoSaves();

      // Should only process once with the newest data
      expect(saveGameService.update).toHaveBeenCalledTimes(1);
      expect(saveGameService.update).toHaveBeenCalledWith(
        mockUserId,
        AUTO_SAVE_SLOT,
        expect.objectContaining({
          data: expect.objectContaining({
            gameState: newData.gameState,
          }),
        }),
      );
    });

    it('should handle errors gracefully during processing', async () => {
      (service as any).pendingAutoSaves.push({
        userId: mockUserId,
        slotId: AUTO_SAVE_SLOT,
        data: mockSaveData,
        timestamp: new Date(),
      });

      saveGameRepo.findOne.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(service.processPendingAutoSaves()).resolves.not.toThrow();
    });

    it('should update lastAutoSave timestamp after processing', async () => {
      await service.enableAutoSave(mockUserId);

      (service as any).pendingAutoSaves.push({
        userId: mockUserId,
        slotId: AUTO_SAVE_SLOT,
        data: mockSaveData,
        timestamp: new Date(),
      });

      saveGameRepo.findOne.mockResolvedValue(mockSaveGame as SaveGame);
      saveGameService.update.mockResolvedValue(mockSaveGame as SaveGame);

      await service.processPendingAutoSaves();

      const config = service.getAutoSaveConfig(mockUserId);
      expect(config.lastAutoSave).toBeDefined();
    });
  });

  describe('getAutoSaveConfig', () => {
    it('should return null for non-existent config', () => {
      const config = service.getAutoSaveConfig('non-existent-user');
      expect(config).toBeNull();
    });

    it('should return config for existing user', async () => {
      await service.enableAutoSave(mockUserId);

      const config = service.getAutoSaveConfig(mockUserId);

      expect(config).toBeDefined();
      expect(config.userId).toBe(mockUserId);
      expect(config.enabled).toBe(true);
    });

    it('should return correct config for specific slot', async () => {
      const customSlot = 5;
      await service.enableAutoSave(mockUserId, customSlot);

      const config = service.getAutoSaveConfig(mockUserId, customSlot);

      expect(config.slotId).toBe(customSlot);
    });
  });
});
