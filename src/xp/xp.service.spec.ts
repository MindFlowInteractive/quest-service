import { EventEmitter2 } from '@nestjs/event-emitter';
import { XpService } from './xp.service';
import { PlayerLevel } from './entities/player-level.entity';
import { XpAward } from './entities/xp-award.entity';
import { User } from '../users/entities/user.entity';
import { UserStreak } from '../users/entities/user-streak.entity';
import { PrivacySettings } from '../privacy/entities/privacy-settings.entity';
import { PLAYER_LEVEL_UP_EVENT, XpAwardReason } from './xp.constants';

describe('XpService', () => {
  let service: XpService;
  let playerLevels: PlayerLevel[];
  let xpAwards: XpAward[];
  let users: Partial<User>[];
  let streaks: Partial<UserStreak>[];
  let privacySettings: Partial<PrivacySettings>[];
  let eventEmitter: { emit: jest.Mock };

  const createRepository = <T extends { id?: string }>(
    store: T[],
    matchers: {
      findOne: (where: any) => T | null | undefined;
      count?: (where: any) => number;
      update?: (criteria: any, partial: Partial<T>) => void;
    },
  ) => ({
    findOne: jest.fn(async ({ where }) => matchers.findOne(where) ?? null),
    create: jest.fn((data) => ({ ...data })),
    save: jest.fn(async (entity) => {
      if (!entity.id) {
        entity.id = `${store.length + 1}`;
        store.push(entity);
      } else {
        const index = store.findIndex((item) => item.id === entity.id);
        if (index >= 0) {
          store[index] = entity;
        } else {
          store.push(entity);
        }
      }

      if (!('createdAt' in entity) || !entity.createdAt) {
        entity.createdAt = new Date();
      }

      return entity;
    }),
    count: jest.fn(async ({ where }) => (matchers.count ? matchers.count(where) : 0)),
    update: jest.fn(async (criteria, partial) => {
      if (matchers.update) {
        matchers.update(criteria, partial);
      }
    }),
  });

  beforeEach(() => {
    playerLevels = [];
    xpAwards = [];
    users = [
      {
        id: 'user-1',
        username: 'user1',
        email: 'user1@example.com',
        level: 1,
        experience: 0,
      },
    ];
    streaks = [];
    privacySettings = [];
    eventEmitter = { emit: jest.fn() };

    const playerLevelRepo = createRepository(playerLevels, {
      findOne: (where) => playerLevels.find((level) => level.userId === where.userId),
    });

    const xpAwardRepo = createRepository(xpAwards, {
      findOne: (where) =>
        xpAwards.find(
          (award) =>
            award.userId === where.userId &&
            award.sourceEventId === where.sourceEventId,
        ),
      count: (where) =>
        xpAwards.filter((award) => {
          if (where.userId && award.userId !== where.userId) {
            return false;
          }

          if (where.reason && award.reason !== where.reason) {
            return false;
          }

          if (where.createdAt) {
            const betweenValues =
              where.createdAt.value ??
              where.createdAt._value ??
              where.createdAt.objectLiteralParameters ??
              [];
            const start = betweenValues[0] as Date;
            const end = betweenValues[1] as Date;
            return award.createdAt >= start && award.createdAt <= end;
          }

          return true;
        }).length,
    });

    const userRepo = createRepository(users as User[], {
      findOne: (where) => users.find((user) => user.id === where.id),
      update: (criteria, partial) => {
        const user = users.find((entry) => entry.id === criteria.id);
        Object.assign(user, partial);
      },
    });

    const userStreakRepo = createRepository(streaks as UserStreak[], {
      findOne: (where) =>
        streaks.find((streak) => streak.user?.id === where.user.id),
    });

    const privacyRepo = createRepository(privacySettings as PrivacySettings[], {
      findOne: (where) =>
        privacySettings.find((settings) => settings.userId === where.userId),
    });

    const getRepository = (entity: any) => {
      if (entity === PlayerLevel) {
        return playerLevelRepo;
      }
      if (entity === XpAward) {
        return xpAwardRepo;
      }
      if (entity === User) {
        return userRepo;
      }
      throw new Error(`Unexpected entity: ${entity?.name}`);
    };

    const dataSource = {
      transaction: jest.fn(async (callback: (manager: any) => any) =>
        callback({
          getRepository,
        }),
      ),
    };

    service = new XpService(
      playerLevelRepo as any,
      xpAwardRepo as any,
      userRepo as any,
      userStreakRepo as any,
      privacyRepo as any,
      dataSource as any,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('accumulates xp across awards', async () => {
    await service.awardXp({
      userId: 'user-1',
      amount: 50,
      reason: XpAwardReason.PUZZLE_SOLVED,
      sourceEventId: 'solve-1',
    });

    const result = await service.awardXp({
      userId: 'user-1',
      amount: 30,
      reason: XpAwardReason.CHALLENGE_BONUS,
      sourceEventId: 'challenge-1',
    });

    expect(result.level.xp).toBe(80);
    expect(result.level.level).toBe(1);
    expect(result.level.xpToNextLevel).toBe(20);
    expect(users[0].experience).toBe(80);
  });

  it('emits a level-up event at the configured boundary', async () => {
    const result = await service.awardXp({
      userId: 'user-1',
      amount: 100,
      reason: XpAwardReason.PUZZLE_SOLVED,
      sourceEventId: 'solve-100',
    });

    expect(result.level.level).toBe(2);
    expect(result.level.xpToNextLevel).toBe(150);
    expect(eventEmitter.emit).toHaveBeenCalledWith(PLAYER_LEVEL_UP_EVENT, {
      userId: 'user-1',
      oldLevel: 1,
      newLevel: 2,
      totalXP: 100,
    });
  });

  it('prevents duplicate awards for the same source event', async () => {
    await service.awardXp({
      userId: 'user-1',
      amount: 50,
      reason: XpAwardReason.PUZZLE_SOLVED,
      sourceEventId: 'solve-duplicate',
    });

    const duplicate = await service.awardXp({
      userId: 'user-1',
      amount: 50,
      reason: XpAwardReason.PUZZLE_SOLVED,
      sourceEventId: 'solve-duplicate',
    });

    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.awarded).toBe(false);
    expect(xpAwards).toHaveLength(1);
    expect(duplicate.level.xp).toBe(50);
  });

  it('awards puzzle solve, no-hints, first-daily, and streak milestone xp', async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    streaks.push({
      id: 'streak-1',
      user: users[0] as User,
      currentStreak: 2,
      lastPuzzleCompletedAt: yesterday,
      streakStartDate: yesterday,
    });

    const level = await service.awardPuzzleCompletionXp({
      userId: 'user-1',
      puzzleId: 'puzzle-1',
      difficulty: 'hard',
      hintsUsed: 0,
      sourceEventId: 'attempt-1',
      solvedAt: new Date(),
    });

    expect(level.xp).toBe(145);
    expect(level.level).toBe(2);
    expect(xpAwards.map((award) => award.reason)).toEqual([
      XpAwardReason.PUZZLE_SOLVED,
      XpAwardReason.NO_HINTS_USED,
      XpAwardReason.FIRST_DAILY_SOLVE,
      XpAwardReason.STREAK_MILESTONE,
    ]);
  });
});
