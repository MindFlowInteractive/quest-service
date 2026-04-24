import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { RewardService } from './reward.service';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';

describe('AchievementService', () => {
  let service: AchievementService;
  let mockAchievementRepository: any;
  let mockUserAchievementRepository: any;
  let mockRewardService: any;

  beforeEach(async () => {
    mockAchievementRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockUserAchievementRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockRewardService = {
      distributeTokenReward: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: getRepositoryToken(Achievement),
          useValue: mockAchievementRepository,
        },
        {
          provide: getRepositoryToken(UserAchievement),
          useValue: mockUserAchievementRepository,
        },
        {
          provide: RewardService,
          useValue: mockRewardService,
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
  });

  describe('createAchievement', () => {
    it('should create a new achievement', async () => {
      const achievementData = {
        name: 'First Puzzle',
        description: 'Solve your first puzzle',
        category: 'puzzles',
        points: 10,
        unlockConditions: { type: 'puzzle_solved', count: 1 },
      };

      const mockAchievement = { id: '123', ...achievementData };

      mockAchievementRepository.create.mockReturnValue(mockAchievement);
      mockAchievementRepository.save.mockResolvedValue(mockAchievement);

      const result = await service.createAchievement(achievementData);

      expect(result).toEqual(mockAchievement);
      expect(mockAchievementRepository.create).toHaveBeenCalledWith(achievementData);
    });
  });

  describe('getAchievementById', () => {
    it('should return an achievement by ID', async () => {
      const mockAchievement = {
        id: '123',
        name: 'First Puzzle',
        category: 'puzzles',
      };

      mockAchievementRepository.findOne.mockResolvedValue(mockAchievement);

      const result = await service.getAchievementById('123');

      expect(result).toEqual(mockAchievement);
    });

    it('should throw NotFoundException if achievement not found', async () => {
      mockAchievementRepository.findOne.mockResolvedValue(null);

      await expect(service.getAchievementById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should return achievements by category', async () => {
      const mockAchievements = [
        { id: '1', name: 'Puzzle 1', category: 'puzzles', isActive: true },
        { id: '2', name: 'Puzzle 2', category: 'puzzles', isActive: true },
      ];

      mockAchievementRepository.find.mockResolvedValue(mockAchievements);

      const result = await service.getAchievementsByCategory('puzzles');

      expect(result).toEqual(mockAchievements);
      expect(mockAchievementRepository.find).toHaveBeenCalledWith({
        where: { category: 'puzzles', isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getAllAchievements', () => {
    it('should return all active achievements', async () => {
      const mockAchievements = [
        { id: '1', name: 'Achievement 1', isActive: true },
        { id: '2', name: 'Achievement 2', isActive: true },
      ];

      mockAchievementRepository.find.mockResolvedValue(mockAchievements);

      const result = await service.getAllAchievements();

      expect(result).toEqual(mockAchievements);
      expect(mockAchievementRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { category: 'ASC', createdAt: 'DESC' },
      });
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock an achievement and distribute rewards', async () => {
      const userId = 'user-123';
      const achievementId = 'achievement-123';

      const mockAchievement = {
        id: achievementId,
        name: 'First Puzzle',
        points: 10,
        isActive: true,
      };

      const mockUserAchievement = {
        id: 'ua-123',
        userId,
        achievementId,
        isUnlocked: true,
        unlockedAt: new Date(),
        progress: 100,
      };

      mockAchievementRepository.findOne.mockResolvedValue(mockAchievement);
      mockUserAchievementRepository.findOne.mockResolvedValue(null);
      mockUserAchievementRepository.create.mockReturnValue(mockUserAchievement);
      mockUserAchievementRepository.save.mockResolvedValue(mockUserAchievement);
      mockAchievementRepository.createQueryBuilder.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      });

      const result = await service.unlockAchievement(userId, achievementId);

      expect(result.isUnlocked).toBe(true);
      expect(mockRewardService.distributeTokenReward).toHaveBeenCalledWith(
        userId,
        10,
        expect.stringContaining('First Puzzle'),
      );
    });

    it('should be idempotent - not re-unlock already unlocked achievement', async () => {
      const userId = 'user-123';
      const achievementId = 'achievement-123';

      const mockAchievement = {
        id: achievementId,
        name: 'First Puzzle',
        points: 10,
        isActive: true,
      };

      const mockUserAchievement = {
        id: 'ua-123',
        userId,
        achievementId,
        isUnlocked: true,
        unlockedAt: new Date(),
        progress: 100,
      };

      mockAchievementRepository.findOne.mockResolvedValue(mockAchievement);
      mockUserAchievementRepository.findOne.mockResolvedValue(mockUserAchievement);

      const result = await service.unlockAchievement(userId, achievementId);

      expect(result).toEqual(mockUserAchievement);
      expect(mockRewardService.distributeTokenReward).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if achievement not found', async () => {
      mockAchievementRepository.findOne.mockResolvedValue(null);

      await expect(service.unlockAchievement('user-123', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserAchievements', () => {
    it('should return all achievements for a user', async () => {
      const userId = 'user-123';
      const mockUserAchievements = [
        {
          id: 'ua-1',
          userId,
          achievementId: 'a-1',
          isUnlocked: true,
          achievement: { id: 'a-1', name: 'Achievement 1' },
        },
        {
          id: 'ua-2',
          userId,
          achievementId: 'a-2',
          isUnlocked: false,
          achievement: { id: 'a-2', name: 'Achievement 2' },
        },
      ];

      mockUserAchievementRepository.find.mockResolvedValue(mockUserAchievements);

      const result = await service.getUserAchievements(userId);

      expect(result).toEqual(mockUserAchievements);
      expect(mockUserAchievementRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['achievement'],
        order: { unlockedAt: 'DESC' },
      });
    });
  });

  describe('checkAndUnlockAchievements', () => {
    it('should unlock achievements that meet conditions', async () => {
      const userId = 'user-123';
      const activityData = { puzzleCount: 5 };

      const mockAchievements = [
        {
          id: 'a-1',
          name: 'Puzzle Master',
          unlockConditions: { type: 'puzzle_solved', count: 5 },
          isActive: true,
          points: 10,
        },
      ];

      const mockUserAchievement = {
        id: 'ua-1',
        userId,
        achievementId: 'a-1',
        isUnlocked: true,
      };

      mockAchievementRepository.find.mockResolvedValue(mockAchievements);
      mockAchievementRepository.findOne.mockResolvedValue(mockAchievements[0]);
      mockUserAchievementRepository.findOne.mockResolvedValue(null);
      mockUserAchievementRepository.create.mockReturnValue(mockUserAchievement);
      mockUserAchievementRepository.save.mockResolvedValue(mockUserAchievement);
      mockAchievementRepository.createQueryBuilder.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      });

      const result = await service.checkAndUnlockAchievements(userId, activityData);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].isUnlocked).toBe(true);
    });
  });

  describe('updateUserProgress', () => {
    it('should update progress and check for unlocks', async () => {
      const userId = 'user-123';
      const activityType = 'puzzle_solved';
      const data = { puzzleId: 'p-1' };

      mockAchievementRepository.find.mockResolvedValue([]);

      await service.updateUserProgress(userId, activityType, data);

      expect(mockAchievementRepository.find).toHaveBeenCalled();
    });
  });
});
