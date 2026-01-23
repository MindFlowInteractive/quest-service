import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaveAnalyticsService } from './save-analytics.service';
import { SaveGameAnalytics } from '../entities/save-game-analytics.entity';
import { SaveType } from '../interfaces/save-game.interfaces';

describe('SaveAnalyticsService', () => {
  let service: SaveAnalyticsService;
  let analyticsRepo: jest.Mocked<Repository<SaveGameAnalytics>>;

  const mockUserId = 'user-123';
  const mockAnalytics: Partial<SaveGameAnalytics> = {
    id: 'analytics-123',
    userId: mockUserId,
    totalSaves: 10,
    totalLoads: 5,
    autoSaves: 3,
    manualSaves: 5,
    quickSaves: 2,
    cloudSyncs: 8,
    syncConflicts: 1,
    conflictsResolved: 1,
    corruptionEvents: 0,
    recoveryAttempts: 0,
    successfulRecoveries: 0,
    totalDataSaved: 50000,
    averageSaveSize: 5000,
    lastSaveAt: new Date(),
    lastLoadAt: new Date(),
    lastSyncAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveAnalyticsService,
        {
          provide: getRepositoryToken(SaveGameAnalytics),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SaveAnalyticsService>(SaveAnalyticsService);
    analyticsRepo = module.get(getRepositoryToken(SaveGameAnalytics));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateAnalytics', () => {
    it('should return existing analytics', async () => {
      analyticsRepo.findOne.mockResolvedValue(mockAnalytics as SaveGameAnalytics);

      const result = await service.getOrCreateAnalytics(mockUserId);

      expect(analyticsRepo.findOne).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result).toEqual(mockAnalytics);
    });

    it('should create new analytics if none exists', async () => {
      analyticsRepo.findOne.mockResolvedValue(null);
      const newAnalytics = { ...mockAnalytics, totalSaves: 0 };
      analyticsRepo.create.mockReturnValue(newAnalytics as SaveGameAnalytics);
      analyticsRepo.save.mockResolvedValue(newAnalytics as SaveGameAnalytics);

      const result = await service.getOrCreateAnalytics(mockUserId);

      expect(analyticsRepo.create).toHaveBeenCalledWith({ userId: mockUserId });
      expect(analyticsRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('recordSave', () => {
    beforeEach(() => {
      analyticsRepo.findOne.mockResolvedValue({ ...mockAnalytics } as SaveGameAnalytics);
      analyticsRepo.save.mockImplementation(async (entity) => entity as SaveGameAnalytics);
    });

    it('should increment totalSaves and update lastSaveAt', async () => {
      await service.recordSave(mockUserId, SaveType.MANUAL, 1000);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSaves: mockAnalytics.totalSaves + 1,
          lastSaveAt: expect.any(Date),
        }),
      );
    });

    it('should increment autoSaves for AUTO save type', async () => {
      await service.recordSave(mockUserId, SaveType.AUTO, 1000);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          autoSaves: mockAnalytics.autoSaves + 1,
        }),
      );
    });

    it('should increment manualSaves for MANUAL save type', async () => {
      await service.recordSave(mockUserId, SaveType.MANUAL, 1000);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          manualSaves: mockAnalytics.manualSaves + 1,
        }),
      );
    });

    it('should increment quickSaves for QUICKSAVE save type', async () => {
      await service.recordSave(mockUserId, SaveType.QUICKSAVE, 1000);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quickSaves: mockAnalytics.quickSaves + 1,
        }),
      );
    });

    it('should update totalDataSaved and averageSaveSize', async () => {
      const dataSize = 2000;
      await service.recordSave(mockUserId, SaveType.MANUAL, dataSize);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          totalDataSaved: Number(mockAnalytics.totalDataSaved) + dataSize,
        }),
      );
    });
  });

  describe('recordLoad', () => {
    beforeEach(() => {
      analyticsRepo.findOne.mockResolvedValue({ ...mockAnalytics } as SaveGameAnalytics);
      analyticsRepo.save.mockImplementation(async (entity) => entity as SaveGameAnalytics);
    });

    it('should increment totalLoads and update lastLoadAt', async () => {
      await service.recordLoad(mockUserId);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          totalLoads: mockAnalytics.totalLoads + 1,
          lastLoadAt: expect.any(Date),
        }),
      );
    });
  });

  describe('recordSync', () => {
    beforeEach(() => {
      analyticsRepo.findOne.mockResolvedValue({ ...mockAnalytics } as SaveGameAnalytics);
      analyticsRepo.save.mockImplementation(async (entity) => entity as SaveGameAnalytics);
    });

    it('should increment cloudSyncs and update lastSyncAt', async () => {
      await service.recordSync(mockUserId, false);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cloudSyncs: mockAnalytics.cloudSyncs + 1,
          lastSyncAt: expect.any(Date),
        }),
      );
    });

    it('should increment syncConflicts when conflict occurred', async () => {
      await service.recordSync(mockUserId, true);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          syncConflicts: mockAnalytics.syncConflicts + 1,
        }),
      );
    });

    it('should not increment syncConflicts when no conflict', async () => {
      await service.recordSync(mockUserId, false);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          syncConflicts: mockAnalytics.syncConflicts,
        }),
      );
    });
  });

  describe('recordConflictResolved', () => {
    beforeEach(() => {
      analyticsRepo.findOne.mockResolvedValue({ ...mockAnalytics } as SaveGameAnalytics);
      analyticsRepo.save.mockImplementation(async (entity) => entity as SaveGameAnalytics);
    });

    it('should increment conflictsResolved', async () => {
      await service.recordConflictResolved(mockUserId);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          conflictsResolved: mockAnalytics.conflictsResolved + 1,
        }),
      );
    });
  });

  describe('recordCorruption', () => {
    beforeEach(() => {
      analyticsRepo.findOne.mockResolvedValue({ ...mockAnalytics } as SaveGameAnalytics);
      analyticsRepo.save.mockImplementation(async (entity) => entity as SaveGameAnalytics);
    });

    it('should increment corruptionEvents', async () => {
      await service.recordCorruption(mockUserId);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          corruptionEvents: mockAnalytics.corruptionEvents + 1,
        }),
      );
    });
  });

  describe('recordRecoveryAttempt', () => {
    beforeEach(() => {
      analyticsRepo.findOne.mockResolvedValue({ ...mockAnalytics } as SaveGameAnalytics);
      analyticsRepo.save.mockImplementation(async (entity) => entity as SaveGameAnalytics);
    });

    it('should increment recoveryAttempts', async () => {
      await service.recordRecoveryAttempt(mockUserId, false);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          recoveryAttempts: mockAnalytics.recoveryAttempts + 1,
        }),
      );
    });

    it('should increment successfulRecoveries when recovery succeeds', async () => {
      await service.recordRecoveryAttempt(mockUserId, true);

      expect(analyticsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          recoveryAttempts: mockAnalytics.recoveryAttempts + 1,
          successfulRecoveries: mockAnalytics.successfulRecoveries + 1,
        }),
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics summary', async () => {
      analyticsRepo.findOne.mockResolvedValue(mockAnalytics as SaveGameAnalytics);

      const result = await service.getAnalytics(mockUserId);

      expect(result).toEqual({
        totalSaves: mockAnalytics.totalSaves,
        totalLoads: mockAnalytics.totalLoads,
        autoSaves: mockAnalytics.autoSaves,
        manualSaves: mockAnalytics.manualSaves,
        cloudSyncs: mockAnalytics.cloudSyncs,
        syncConflicts: mockAnalytics.syncConflicts,
        corruptionEvents: mockAnalytics.corruptionEvents,
        lastSaveAt: mockAnalytics.lastSaveAt,
        lastLoadAt: mockAnalytics.lastLoadAt,
        averageSaveSize: mockAnalytics.averageSaveSize,
      });
    });
  });

  describe('getGlobalStats', () => {
    it('should return global statistics', async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalUsers: '100',
          totalSaves: '5000',
          totalSyncs: '3000',
          avgConflictRate: '0.05',
          avgCorruptionRate: '0.001',
        }),
      };
      analyticsRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getGlobalStats();

      expect(result).toEqual({
        totalUsers: 100,
        totalSaves: 5000,
        totalSyncs: 3000,
        averageConflictRate: 0.05,
        averageCorruptionRate: 0.001,
      });
    });

    it('should handle null results gracefully', async () => {
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          totalUsers: null,
          totalSaves: null,
          totalSyncs: null,
          avgConflictRate: null,
          avgCorruptionRate: null,
        }),
      };
      analyticsRepo.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.getGlobalStats();

      expect(result).toEqual({
        totalUsers: 0,
        totalSaves: 0,
        totalSyncs: 0,
        averageConflictRate: 0,
        averageCorruptionRate: 0,
      });
    });
  });
});
