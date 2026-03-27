import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GameSession } from './entities/game-session.entity';
import { GameSessionService } from './services/game-session.service';
import { CrashRecoveryJob } from './services/crash-recovery.job';
import { PlayerEventsService } from '../player-events/player-events.service';
import { PuzzleVersionService } from '../puzzles/services/puzzle-version.service';
import { CacheService } from '../cache/services/cache.service';
import { NotificationService } from '../notifications/notification.service';

const SESSION_ID = 'session-uuid-1';
const USER_ID = 'user-uuid-1';
const GRACE_SECS = 300;

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: SESSION_ID,
    userId: USER_ID,
    puzzleId: 'puzzle-1',
    puzzleVersionId: undefined,
    status: 'IN_PROGRESS',
    state: { progressPercent: 40 },
    lastActiveAt: new Date(),
    suspendedAt: null,
    totalMoves: 10,
    hintsUsed: 2,
    duration: 5,
    replayLog: [],
    shareCode: null,
    isSpectatorAllowed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as GameSession;
}

function makeMockRepo(session?: GameSession) {
  return {
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ ...d })),
    findOneBy: jest.fn(() => Promise.resolve(session ?? null)),
    findOne: jest.fn(() => Promise.resolve(session ?? null)),
    find: jest.fn(() => Promise.resolve(session ? [session] : [])),
    update: jest.fn(() => Promise.resolve({ affected: 1 })),
  };
}

describe('Crash Recovery — GameSessionService', () => {
  let service: GameSessionService;
  let repo: ReturnType<typeof makeMockRepo>;
  let cache: { get: jest.Mock; set: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    const session = makeSession();
    repo = makeMockRepo(session);
    cache = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameSessionService,
        { provide: getRepositoryToken(GameSession), useValue: repo },
        { provide: PlayerEventsService, useValue: { emitPlayerEvent: jest.fn() } },
        { provide: PuzzleVersionService, useValue: { getCurrentVersionId: jest.fn() } },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    service = module.get<GameSessionService>(GameSessionService);
  });

  describe('suspend()', () => {
    it('marks the session SUSPENDED and records suspendedAt', async () => {
      const result = await service.suspend(SESSION_ID);
      expect(result.status).toBe('SUSPENDED');
      expect(result.suspendedAt).toBeInstanceOf(Date);
    });

    it('saves a state snapshot to Redis with extended TTL', async () => {
      await service.suspend(SESSION_ID);
      expect(cache.set).toHaveBeenCalledWith(
        `session:suspended:${SESSION_ID}`,
        expect.any(Object),
        expect.objectContaining({ ttl: expect.any(Number) }),
      );
    });

    it('throws NotFoundException when session does not exist', async () => {
      repo.findOneBy.mockResolvedValueOnce(null);
      await expect(service.suspend(SESSION_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resumeById()', () => {
    beforeEach(() => {
      // Put the session in SUSPENDED state within the grace window
      const suspended = makeSession({
        status: 'SUSPENDED',
        suspendedAt: new Date(Date.now() - 60_000), // 1 min ago, well within 5 min window
      });
      repo.findOneBy.mockResolvedValue(suspended);
      cache.get.mockResolvedValue({ progressPercent: 40, currentLevel: 2 });
    });

    it('restores status to IN_PROGRESS and clears suspendedAt', async () => {
      const result = await service.resumeById(SESSION_ID, USER_ID);
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.suspendedAt).toBeNull();
    });

    it('restores state from Redis snapshot', async () => {
      const result = await service.resumeById(SESSION_ID, USER_ID);
      expect(result.state).toEqual({ progressPercent: 40, currentLevel: 2 });
      expect(cache.delete).toHaveBeenCalledWith(`session:suspended:${SESSION_ID}`);
    });

    it('falls back to DB state when Redis snapshot is missing', async () => {
      cache.get.mockResolvedValueOnce(null);
      const suspended = makeSession({
        status: 'SUSPENDED',
        suspendedAt: new Date(Date.now() - 60_000),
        state: { progressPercent: 40 },
      });
      repo.findOneBy.mockResolvedValueOnce(suspended);

      const result = await service.resumeById(SESSION_ID, USER_ID);
      expect(result.state).toEqual({ progressPercent: 40 });
    });

    it('throws ForbiddenException when grace window has expired', async () => {
      const expiredAt = new Date(Date.now() - (GRACE_SECS + 60) * 1000);
      const expired = makeSession({ status: 'SUSPENDED', suspendedAt: expiredAt });
      repo.findOneBy.mockResolvedValueOnce(expired);

      await expect(service.resumeById(SESSION_ID, USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when session belongs to a different user', async () => {
      const otherUser = makeSession({ status: 'SUSPENDED', suspendedAt: new Date(), userId: 'other-user' });
      repo.findOneBy.mockResolvedValueOnce(otherUser);

      await expect(service.resumeById(SESSION_ID, USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when session is not suspended', async () => {
      const active = makeSession({ status: 'IN_PROGRESS' });
      repo.findOneBy.mockResolvedValueOnce(active);

      await expect(service.resumeById(SESSION_ID, USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when session does not exist', async () => {
      repo.findOneBy.mockResolvedValueOnce(null);
      await expect(service.resumeById(SESSION_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSuspendedSessions()', () => {
    it('returns all SUSPENDED sessions for the user', async () => {
      const suspended = makeSession({ status: 'SUSPENDED', suspendedAt: new Date() });
      repo.find.mockResolvedValueOnce([suspended]);

      const result = await service.getSuspendedSessions(USER_ID);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('SUSPENDED');
      expect(repo.find).toHaveBeenCalledWith({ where: { userId: USER_ID, status: 'SUSPENDED' } });
    });

    it('returns empty array when no suspended sessions exist', async () => {
      repo.find.mockResolvedValueOnce([]);
      const result = await service.getSuspendedSessions(USER_ID);
      expect(result).toHaveLength(0);
    });
  });
});

describe('Crash Recovery — CrashRecoveryJob', () => {
  let job: CrashRecoveryJob;
  let repo: ReturnType<typeof makeMockRepo>;
  let notificationService: { emitPushEvent: jest.Mock };
  let playerEventsService: { emitPlayerEvent: jest.Mock };
  let cache: { get: jest.Mock; set: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    notificationService = { emitPushEvent: jest.fn().mockResolvedValue(undefined) };
    playerEventsService = { emitPlayerEvent: jest.fn().mockResolvedValue(undefined) };
    cache = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrashRecoveryJob,
        { provide: getRepositoryToken(GameSession), useValue: repo = makeMockRepo() },
        { provide: NotificationService, useValue: notificationService },
        { provide: PlayerEventsService, useValue: playerEventsService },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    job = module.get<CrashRecoveryJob>(CrashRecoveryJob);
  });

  it('does nothing when there are no expired suspended sessions', async () => {
    repo.find.mockResolvedValueOnce([]);
    await job.expireSuspendedSessions();
    expect(repo.save).not.toHaveBeenCalled();
    expect(notificationService.emitPushEvent).not.toHaveBeenCalled();
  });

  it('marks expired sessions as ABANDONED', async () => {
    const expiredAt = new Date(Date.now() - (GRACE_SECS + 120) * 1000);
    const session = makeSession({ status: 'SUSPENDED', suspendedAt: expiredAt });
    repo.find.mockResolvedValueOnce([session]);

    await job.expireSuspendedSessions();

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ABANDONED' }),
    );
  });

  it('emits puzzle.abandoned player event with stats payload', async () => {
    const expiredAt = new Date(Date.now() - (GRACE_SECS + 120) * 1000);
    const session = makeSession({
      status: 'SUSPENDED',
      suspendedAt: expiredAt,
      hintsUsed: 3,
      duration: 7,
      state: { progressPercent: 65 },
    });
    repo.find.mockResolvedValueOnce([session]);

    await job.expireSuspendedSessions();

    expect(playerEventsService.emitPlayerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'puzzle.abandoned',
        payload: expect.objectContaining({
          timePlayed: 7,
          hintsUsed: 3,
          progressPercent: 65,
        }),
      }),
    );
  });

  it('sends a push notification to the player', async () => {
    const expiredAt = new Date(Date.now() - (GRACE_SECS + 120) * 1000);
    const session = makeSession({ status: 'SUSPENDED', suspendedAt: expiredAt });
    repo.find.mockResolvedValueOnce([session]);

    await job.expireSuspendedSessions();

    expect(notificationService.emitPushEvent).toHaveBeenCalledWith(
      USER_ID,
      'sessionExpired',
      expect.objectContaining({
        title: 'Session Expired',
      }),
    );
  });

  it('cleans up the Redis snapshot after expiry', async () => {
    const expiredAt = new Date(Date.now() - (GRACE_SECS + 120) * 1000);
    const session = makeSession({ status: 'SUSPENDED', suspendedAt: expiredAt });
    repo.find.mockResolvedValueOnce([session]);

    await job.expireSuspendedSessions();

    expect(cache.delete).toHaveBeenCalledWith(`session:suspended:${SESSION_ID}`);
  });

  it('continues processing other sessions if one throws', async () => {
    const expiredAt = new Date(Date.now() - (GRACE_SECS + 120) * 1000);
    const s1 = makeSession({ id: 'session-1', status: 'SUSPENDED', suspendedAt: expiredAt });
    const s2 = makeSession({ id: 'session-2', status: 'SUSPENDED', suspendedAt: expiredAt });
    repo.find.mockResolvedValueOnce([s1, s2]);

    // First save throws, second should still proceed
    repo.save
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce({ ...s2, status: 'ABANDONED' });

    await expect(job.expireSuspendedSessions()).resolves.not.toThrow();
    expect(repo.save).toHaveBeenCalledTimes(2);
  });
});
