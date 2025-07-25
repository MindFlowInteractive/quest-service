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

  it('should get leaderboards by category and period', async () => {
    const leaderboards = [{ id: 1, category: 'cat', period: 'daily' }];
    leaderboardRepo.find.mockResolvedValue(leaderboards);
    const result = await service.getLeaderboardsByCategoryAndPeriod('cat', 'daily');
    expect(result).toEqual(leaderboards);
    expect(leaderboardRepo.find).toHaveBeenCalledWith({ where: { category: 'cat', period: 'daily', isActive: true } });
  });

  describe('getLeaderboardWithEntries', () => {
    beforeEach(() => {
      leaderboardRepo.findOne.mockReset();
      entryRepo.find.mockReset();
      mockCache.get.mockReset();
      mockCache.set.mockReset();
    });
    it('should return leaderboard with entries and cache result', async () => {
      leaderboardRepo.findOne.mockResolvedValue({ id: 1, visibility: 'public' });
      entryRepo.find.mockResolvedValue([
        { userId: 1, score: 100 },
        { userId: 2, score: 200 },
      ]);
      mockCache.get.mockResolvedValue(undefined);
      mockCache.set.mockResolvedValue(undefined);
      const result = await service.getLeaderboardWithEntries(1, 'score', 'DESC');
      expect(result.entries.length).toBe(2);
      expect(mockCache.set).toHaveBeenCalled();
    });
    it('should deny access to private leaderboard', async () => {
      leaderboardRepo.findOne.mockResolvedValue({ id: 1, visibility: 'private', allowedUserIds: [2] });
      await expect(service.getLeaderboardWithEntries(1, 'score', 'DESC', undefined, 1)).rejects.toThrow('Access denied: private leaderboard');
    });
    it('should deny access to friends-only leaderboard', async () => {
      leaderboardRepo.findOne.mockResolvedValue({ id: 1, visibility: 'friends', allowedUserIds: [2] });
      await expect(service.getLeaderboardWithEntries(1, 'score', 'DESC', undefined, 1)).rejects.toThrow('Access denied: friends-only leaderboard');
    });
  });

  it('should archive and reset leaderboard', async () => {
    entryRepo.update.mockResolvedValue({});
    mockCache.reset.mockResolvedValue(undefined);
    await service.archiveAndResetLeaderboard(1);
    expect(entryRepo.update).toHaveBeenCalledWith(
      { leaderboard: { id: 1 }, archived: false },
      { archived: true, archivedAt: expect.any(Date) }
    );
    expect(mockCache.reset).toHaveBeenCalled();
  });

  it('should get user rank summary', async () => {
    entryRepo.find.mockResolvedValue([
      { userId: 1, score: 100 },
      { userId: 2, score: 200 },
    ]);
    const result = await service.getUserRankSummary(1, 2);
    expect(result.rank).toBe(1);
    expect(result.userId).toBe(2);
    expect(result.shareMessage).toContain('ranked #1');
  });

  it('should return message for challengeUser', async () => {
    const result = await service.challengeUser(1, 2, 3);
    expect(result.message).toContain('challenged user 3');
  });

  it('should award achievement if user qualifies', async () => {
    // Setup: user is rank 1, achievement for rank 1
    entryRepo.find.mockResolvedValue([
      { userId: 2, score: 200 },
      { userId: 1, score: 100 },
    ]);
    mockAchievementsService.findLeaderboardAchievements.mockResolvedValue([
      { id: 10, criteria: { rank: 1 } },
    ]);
    mockAchievementsService.awardAchievementToUser.mockResolvedValue({});
    await service['checkAndAwardLeaderboardAchievements'](1, 2);
    expect(mockAchievementsService.awardAchievementToUser).toHaveBeenCalledWith(10, 2);
  });
}); 