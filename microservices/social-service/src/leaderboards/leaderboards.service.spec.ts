import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardsService } from './leaderboards.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeaderboardEntry } from './leaderboard-entry.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('LeaderboardsService', () => {
  let service: LeaderboardsService;
  let leaderboardRepository: Repository<LeaderboardEntry>;

  const mockLeaderboardRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardsService,
        {
          provide: getRepositoryToken(LeaderboardEntry),
          useValue: mockLeaderboardRepository,
        },
      ],
    }).compile();

    service = module.get<LeaderboardsService>(LeaderboardsService);
    leaderboardRepository = module.get<Repository<LeaderboardEntry>>(
      getRepositoryToken(LeaderboardEntry),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrGetEntry', () => {
    it('should create new entry', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockEntry = {
        id: '123',
        userId,
        seasonId: 'current',
        score: 100,
        rank: 1,
      };

      mockLeaderboardRepository.findOne.mockResolvedValueOnce(null);
      mockLeaderboardRepository.create.mockReturnValue(mockEntry);
      mockLeaderboardRepository.save.mockResolvedValue(mockEntry);
      mockLeaderboardRepository.findOne.mockResolvedValueOnce(mockEntry);

      const result = await service.createOrGetEntry({
        userId,
        score: 100,
      });

      expect(result).toBeDefined();
      expect(mockLeaderboardRepository.create).toHaveBeenCalled();
    });
  });

  describe('recordWin', () => {
    it('should record win and update score', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const seasonId = 'current';
      const mockEntry = {
        id: '123',
        userId,
        seasonId,
        score: 100,
        wins: 5,
        losses: 2,
        rank: 1,
      };

      mockLeaderboardRepository.findOne.mockResolvedValue(mockEntry);
      mockLeaderboardRepository.save.mockResolvedValue({
        ...mockEntry,
        wins: 6,
        score: 110,
      });

      const result = await service.recordWin(userId, seasonId, 10);

      expect(result.wins).toBe(6);
      expect(result.score).toBe(110);
    });
  });

  describe('getWinRate', () => {
    it('should calculate win rate correctly', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockEntry = {
        id: '123',
        userId,
        seasonId: 'current',
        score: 100,
        wins: 10,
        losses: 5,
        rank: 1,
      };

      mockLeaderboardRepository.findOne.mockResolvedValue(mockEntry);

      const result = await service.getWinRate(userId, 'current');

      expect(result).toBeCloseTo(66.67, 1);
    });

    it('should return 0 when no matches played', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const mockEntry = {
        id: '123',
        userId,
        seasonId: 'current',
        score: 0,
        wins: 0,
        losses: 0,
        rank: 0,
      };

      mockLeaderboardRepository.findOne.mockResolvedValue(mockEntry);

      const result = await service.getWinRate(userId, 'current');

      expect(result).toBe(0);
    });
  });

  describe('getTopPlayers', () => {
    it('should return top N players', async () => {
      const mockPlayers = [
        { id: '1', userId: '123', rank: 1, score: 1000 },
        { id: '2', userId: '456', rank: 2, score: 950 },
        { id: '3', userId: '789', rank: 3, score: 900 },
      ];

      mockLeaderboardRepository.find.mockResolvedValue(mockPlayers);

      const result = await service.getTopPlayers('current', 10);

      expect(result).toHaveLength(3);
      expect(result[0].rank).toBe(1);
    });
  });
});
