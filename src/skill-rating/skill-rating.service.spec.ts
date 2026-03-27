import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SkillRatingService } from './skill-rating.service';
import { ELOService } from './elo.service';
import { PlayerRating, SkillTier, SeasonStatus } from './entities/player-rating.entity';
import { RatingHistory, RatingChangeReason } from './entities/rating-history.entity';
import { Season } from './entities/season.entity';
import { User } from '../users/entities/user.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTIVE_SEASON = {
  seasonId: 'S001',
  defaultRating: 1200,
  status: 'active',
};

function makeRating(overrides: Partial<PlayerRating> = {}): PlayerRating {
  return {
    id: 'rating-1',
    userId: 'user-1',
    rating: 1200,
    ratingDeviation: 0,
    tier: SkillTier.SILVER,
    seasonId: 'S001',
    seasonStatus: SeasonStatus.ACTIVE,
    gamesPlayed: 30,
    wins: 15,
    losses: 15,
    draws: 0,
    streak: 0,
    bestStreak: 5,
    lastPlayedAt: new Date(),
    lastRatingUpdate: new Date(),
    winRate: 0.5,
    statistics: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ratingHistory: [],
    user: null as any,
    ...overrides,
  } as PlayerRating;
}

function makePuzzle(overrides: Partial<Puzzle> = {}): Puzzle {
  return {
    id: 'puzzle-1',
    difficulty: 'medium',
    difficultyRating: 5,
    timeLimit: 300,
    basePoints: 100,
    ...overrides,
  } as Puzzle;
}

function makeMockRepo() {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ ...d, id: d.id ?? 'new-id' })),
    count: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('SkillRatingService', () => {
  let service: SkillRatingService;
  let playerRatingRepo: ReturnType<typeof makeMockRepo>;
  let ratingHistoryRepo: ReturnType<typeof makeMockRepo>;
  let seasonRepo: ReturnType<typeof makeMockRepo>;
  let userRepo: ReturnType<typeof makeMockRepo>;
  let puzzleRepo: ReturnType<typeof makeMockRepo>;
  let eloService: ELOService;

  beforeEach(async () => {
    playerRatingRepo = makeMockRepo();
    ratingHistoryRepo = makeMockRepo();
    seasonRepo = makeMockRepo();
    userRepo = makeMockRepo();
    puzzleRepo = makeMockRepo();

    // ELO service is a real instance but its repo deps are mocked
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillRatingService,
        ELOService,
        { provide: getRepositoryToken(PlayerRating), useValue: playerRatingRepo },
        { provide: getRepositoryToken(RatingHistory), useValue: ratingHistoryRepo },
        { provide: getRepositoryToken(Season), useValue: seasonRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Puzzle), useValue: puzzleRepo },
      ],
    }).compile();

    service = module.get<SkillRatingService>(SkillRatingService);
    eloService = module.get<ELOService>(ELOService);

    // Default season
    seasonRepo.findOne.mockResolvedValue(ACTIVE_SEASON);
  });

  // -------------------------------------------------------------------------
  // 1. Rating gain on solve
  // -------------------------------------------------------------------------
  describe('rating gain on puzzle solve', () => {
    it('increases the player rating when a puzzle is completed', async () => {
      const rating = makeRating({ rating: 1200, gamesPlayed: 30 });
      const puzzle = makePuzzle({ difficultyRating: 5, difficulty: 'medium', timeLimit: 300 });

      playerRatingRepo.findOne.mockResolvedValue(rating);
      puzzleRepo.findOne.mockResolvedValue(puzzle);
      ratingHistoryRepo.create.mockImplementation((d) => d);
      playerRatingRepo.save.mockImplementation((d) => Promise.resolve(d));
      ratingHistoryRepo.save.mockResolvedValue({});

      const updated = await service.updateRatingOnPuzzleCompletion({
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        puzzleDifficulty: 'medium',
        difficultyRating: 5,
        wasCompleted: true,
        timeTaken: 120, // fast
        hintsUsed: 0,
        attempts: 1,
        basePoints: 100,
      });

      expect(updated.rating).toBeGreaterThan(1200);
      expect(updated.wins).toBe(rating.wins + 1);
    });

    it('creates a RatingHistory record with reason PUZZLE_COMPLETED', async () => {
      const rating = makeRating();
      playerRatingRepo.findOne.mockResolvedValue(rating);
      puzzleRepo.findOne.mockResolvedValue(makePuzzle());
      playerRatingRepo.save.mockImplementation((d) => Promise.resolve(d));
      ratingHistoryRepo.create.mockImplementation((d) => d);
      ratingHistoryRepo.save.mockResolvedValue({});

      await service.updateRatingOnPuzzleCompletion({
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        puzzleDifficulty: 'medium',
        difficultyRating: 5,
        wasCompleted: true,
        timeTaken: 200,
        hintsUsed: 0,
        attempts: 1,
        basePoints: 100,
      });

      expect(ratingHistoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ reason: RatingChangeReason.PUZZLE_COMPLETED }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // 2. Rating loss on abandon (only when ≥ 80 % of time elapsed)
  // -------------------------------------------------------------------------
  describe('triggerAbandonRatingUpdate()', () => {
    it('deducts rating when player abandons after ≥ 80 % of the time limit', async () => {
      const rating = makeRating({ rating: 1400, gamesPlayed: 40 });
      const puzzle = makePuzzle({ timeLimit: 300, difficultyRating: 6, difficulty: 'hard' });

      playerRatingRepo.findOne.mockResolvedValue(rating);
      puzzleRepo.findOne.mockResolvedValue(puzzle);
      playerRatingRepo.save.mockImplementation((d) => Promise.resolve(d));
      ratingHistoryRepo.create.mockImplementation((d) => d);
      ratingHistoryRepo.save.mockResolvedValue({});

      const result = await service.triggerAbandonRatingUpdate({
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        timeTaken: 250, // 250 / 300 ≈ 83 % > 80 %
        hintsUsed: 1,
        attempts: 2,
      });

      expect(result).not.toBeNull();
      expect(result!.rating).toBeLessThan(1400);
      expect(result!.losses).toBe(rating.losses + 1);
    });

    it('returns null and skips rating update when player abandons before 80 % threshold', async () => {
      const puzzle = makePuzzle({ timeLimit: 300 });
      puzzleRepo.findOne.mockResolvedValue(puzzle);

      const result = await service.triggerAbandonRatingUpdate({
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        timeTaken: 200, // 200 / 300 ≈ 67 % < 80 %
        hintsUsed: 0,
        attempts: 1,
      });

      expect(result).toBeNull();
      expect(playerRatingRepo.save).not.toHaveBeenCalled();
    });

    it('handles the exact 80 % boundary — counts as a loss', async () => {
      const rating = makeRating({ rating: 1200, gamesPlayed: 35 });
      const puzzle = makePuzzle({ timeLimit: 300 });

      playerRatingRepo.findOne.mockResolvedValue(rating);
      puzzleRepo.findOne.mockResolvedValue(puzzle);
      playerRatingRepo.save.mockImplementation((d) => Promise.resolve(d));
      ratingHistoryRepo.create.mockImplementation((d) => d);
      ratingHistoryRepo.save.mockResolvedValue({});

      const result = await service.triggerAbandonRatingUpdate({
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        timeTaken: 240, // 240 / 300 = exactly 80 %
        hintsUsed: 0,
        attempts: 1,
      });

      expect(result).not.toBeNull();
    });

    it('throws NotFoundException when puzzle does not exist', async () => {
      puzzleRepo.findOne.mockResolvedValue(null);
      await expect(
        service.triggerAbandonRatingUpdate({
          userId: 'user-1',
          puzzleId: 'nonexistent',
          timeTaken: 300,
          hintsUsed: 0,
          attempts: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // 3. K-factor switching
  // -------------------------------------------------------------------------
  describe('K-factor switching via ELOService', () => {
    async function deltaFor(gamesPlayed: number, rating: number): Promise<number> {
      const pr = makeRating({ gamesPlayed, rating });
      const puzzle = makePuzzle({ difficultyRating: 5, timeLimit: 300, difficulty: 'medium' });
      const result = await eloService.calculateRatingChange(pr, puzzle, {
        userId: 'u',
        puzzleId: 'p',
        puzzleDifficulty: 'medium',
        difficultyRating: 5,
        wasCompleted: true,
        timeTaken: 150,
        hintsUsed: 0,
        attempts: 1,
        basePoints: 100,
      });
      return result.kFactor;
    }

    it('uses K=40 (provisional) when gamesPlayed < 30', async () => {
      const k = await deltaFor(10, 1200);
      expect(k).toBe(40);
    });

    it('uses K=20 (established) when gamesPlayed ≥ 30 and rating < 2000', async () => {
      const k = await deltaFor(50, 1500);
      expect(k).toBe(20);
    });

    it('uses K=15 when rating ≥ 2000 and < 2400', async () => {
      const k = await deltaFor(100, 2100);
      expect(k).toBe(15);
    });

    it('uses K=10 (master) when rating ≥ 2400', async () => {
      const k = await deltaFor(200, 2500);
      expect(k).toBe(10);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Percentile calculation
  // -------------------------------------------------------------------------
  describe('getPercentile()', () => {
    beforeEach(() => {
      // getPlayerRating will return a 1400-rated player
      playerRatingRepo.findOne.mockResolvedValue(makeRating({ rating: 1400 }));
    });

    it('returns 50 when exactly half the players have a lower rating', async () => {
      playerRatingRepo.count
        .mockResolvedValueOnce(50)  // players with rating < 1400
        .mockResolvedValueOnce(100); // total players

      const percentile = await service.getPercentile('user-1');
      expect(percentile).toBe(50);
    });

    it('returns 0 when no one has a lower rating (last place)', async () => {
      playerRatingRepo.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(200);

      const percentile = await service.getPercentile('user-1');
      expect(percentile).toBe(0);
    });

    it('returns 100 when the player is alone in the season', async () => {
      playerRatingRepo.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0); // totalCount = 0

      const percentile = await service.getPercentile('user-1');
      expect(percentile).toBe(100);
    });

    it('rounds the percentile to the nearest integer', async () => {
      playerRatingRepo.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(3); // 1/3 ≈ 33.33 → rounds to 33

      const percentile = await service.getPercentile('user-1');
      expect(percentile).toBe(33);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Privacy-aware public rating
  // -------------------------------------------------------------------------
  describe('getPublicPlayerRating()', () => {
    it('returns rating details when the target user has public stats', async () => {
      const user = { id: 'user-2', preferences: { privacy: { showStats: true } } };
      userRepo.findOne.mockResolvedValue(user);
      playerRatingRepo.findOne.mockResolvedValue(makeRating({ userId: 'user-2' }));
      playerRatingRepo.count.mockResolvedValue(0);

      const result = await service.getPublicPlayerRating('user-2', 'user-1');
      expect(result).toBeDefined();
      expect(result.playerRating.userId).toBe('user-2');
    });

    it('throws ForbiddenException when target user has showStats = false', async () => {
      const user = { id: 'user-2', preferences: { privacy: { showStats: false } } };
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.getPublicPlayerRating('user-2', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows access when the requesting user is the target (self-view)', async () => {
      // No userRepo call should happen for self-view
      playerRatingRepo.findOne.mockResolvedValue(makeRating({ userId: 'user-1' }));
      playerRatingRepo.count.mockResolvedValue(0);

      const result = await service.getPublicPlayerRating('user-1', 'user-1');
      expect(result).toBeDefined();
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getPublicPlayerRating('ghost-user', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
