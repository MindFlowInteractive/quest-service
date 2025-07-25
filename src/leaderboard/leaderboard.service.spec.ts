import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Leaderboard } from './entities/leaderboard.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';
import { CACHE_MANAGER } from '@nestjs/common';
import { AchievementsService } from '../achievements/achievements.service';

const mockLeaderboardRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});
const mockEntryRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
});
const mockCache = { get: jest.fn(), set: jest.fn(), reset: jest.fn() };
const mockAchievementsService = { findLeaderboardAchievements: jest.fn(), awardAchievementToUser: jest.fn() };

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let leaderboardRepo;
  let entryRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: getRepositoryToken(Leaderboard), useFactory: mockLeaderboardRepo },
        { provide: getRepositoryToken(LeaderboardEntry), useFactory: mockEntryRepo },
        { provide: CACHE_MANAGER, useValue: mockCache },
        { provide: AchievementsService, useValue: mockAchievementsService },
      ],
    }).compile();
    service = module.get<LeaderboardService>(LeaderboardService);
    leaderboardRepo = module.get(getRepositoryToken(Leaderboard));
    entryRepo = module.get(getRepositoryToken(LeaderboardEntry));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a leaderboard', async () => {
    const dto = { name: 'Test', category: 'cat', period: 'daily' };
    const created = { ...dto };
    leaderboardRepo.create.mockReturnValue(created);
    leaderboardRepo.save.mockResolvedValue(created);
    const result = await service.createLeaderboard(dto as any);
    expect(result).toEqual(created);
    expect(leaderboardRepo.create).toHaveBeenCalledWith(dto);
    expect(leaderboardRepo.save).toHaveBeenCalledWith(created);
  });

  it('should create an entry and reset cache', async () => {
    const dto = { leaderboardId: 1, userId: 2, score: 100 };
    const entry = { ...dto };
    entryRepo.create.mockReturnValue(entry);
    entryRepo.save.mockResolvedValue(entry);
    mockCache.reset.mockResolvedValue(undefined);
    mockAchievementsService.findLeaderboardAchievements.mockResolvedValue([]);
    const result = await service.createEntry(dto as any);
    expect(result).toEqual(entry);
    expect(entryRepo.create).toHaveBeenCalled();
    expect(entryRepo.save).toHaveBeenCalled();
    expect(mockCache.reset).toHaveBeenCalled();
  });

  it('should compute leaderboard analytics', async () => {
    entryRepo.find.mockResolvedValue([
      { userId: 1, score: 100 },
      { userId: 2, score: 200 },
      { userId: 1, score: 150 },
    ]);
    const analytics = await service.getLeaderboardAnalytics(1);
    expect(analytics.participantCount).toBe(2);
    expect(analytics.entryCount).toBe(3);
    expect(analytics.averageScore).toBeCloseTo((100+200+150)/3);
    expect(analytics.topUsers[0].score).toBe(200);
  });
}); 