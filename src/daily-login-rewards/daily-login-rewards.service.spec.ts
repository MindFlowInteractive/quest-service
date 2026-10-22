import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import * as ServiceModule from './daily-login-rewards.service';
import {
  DailyLoginRewardsService,
  daysBetween,
  todayInTimezone,
} from './daily-login-rewards.service';
import { LoginRewardCalendar } from './entities/login-reward-calendar.entity';
import { PlayerLoginRewardClaim } from './entities/player-login-reward-claim.entity';
import { PlayerLoginStreak } from './entities/player-login-streak.entity';

// ─── Mock factory ────────────────────────────────────────────────────────────

const mockRepo = () => ({
  create: jest.fn((d: object) => ({ ...d })),
  save: jest.fn((d: object & { id?: string }) =>
    Promise.resolve({ ...d, id: d.id ?? 'generated-id' }),
  ),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CALENDAR_ID = 'cal-1';
const USER_ID = 'user-1';

const makeCalendar = (
  overrides: Partial<LoginRewardCalendar> = {},
): LoginRewardCalendar => ({
  id: CALENDAR_ID,
  name: 'default',
  cycleLength: 7,
  resetOnMissDays: 1,
  isActive: true,
  rewardDays: [
    { day: 1, label: 'Day 1', reward: { coins: 10 } },
    { day: 2, label: 'Day 2', reward: { coins: 20 } },
    { day: 3, label: 'Day 3', reward: { coins: 30 } },
    { day: 7, label: 'Day 7 Bonus', reward: { coins: 100, item: 'gem' } },
  ],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const makeStreak = (
  overrides: Partial<PlayerLoginStreak> = {},
): PlayerLoginStreak => ({
  id: 'streak-1',
  userId: USER_ID,
  calendarId: CALENDAR_ID,
  lastClaimDate: null,
  currentDay: 1,
  totalClaims: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DailyLoginRewardsService', () => {
  let service: DailyLoginRewardsService;
  let calendarRepo: ReturnType<typeof mockRepo>;
  let claimRepo: ReturnType<typeof mockRepo>;
  let streakRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    calendarRepo = mockRepo();
    claimRepo = mockRepo();
    streakRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyLoginRewardsService,
        {
          provide: getRepositoryToken(LoginRewardCalendar),
          useValue: calendarRepo,
        },
        {
          provide: getRepositoryToken(PlayerLoginRewardClaim),
          useValue: claimRepo,
        },
        {
          provide: getRepositoryToken(PlayerLoginStreak),
          useValue: streakRepo,
        },
      ],
    }).compile();

    service = module.get<DailyLoginRewardsService>(DailyLoginRewardsService);
  });

  // ─── Pure helpers ──────────────────────────────────────────────────────────

  describe('todayInTimezone (pure helper)', () => {
    it('returns a YYYY-MM-DD formatted string', () => {
      const result = todayInTimezone('UTC');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('falls back to UTC for an invalid timezone', () => {
      const utcResult = todayInTimezone('UTC');
      const invalidResult = todayInTimezone('Not/A/Timezone');
      expect(invalidResult).toBe(utcResult);
    });

    it('accepts valid IANA timezone strings', () => {
      expect(() => todayInTimezone('America/New_York')).not.toThrow();
      expect(() => todayInTimezone('Asia/Tokyo')).not.toThrow();
      expect(() => todayInTimezone('Europe/London')).not.toThrow();
    });
  });

  describe('daysBetween (pure helper)', () => {
    it('returns 0 for the same date', () => {
      expect(daysBetween('2026-10-01', '2026-10-01')).toBe(0);
    });

    it('returns 1 for consecutive days', () => {
      expect(daysBetween('2026-10-01', '2026-10-02')).toBe(1);
    });

    it('returns the correct count across a month boundary', () => {
      expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
      expect(daysBetween('2026-01-01', '2026-02-01')).toBe(31);
    });

    it('is symmetric (order does not matter)', () => {
      expect(daysBetween('2026-10-05', '2026-10-01')).toBe(
        daysBetween('2026-10-01', '2026-10-05'),
      );
    });

    it('handles a leap-year day', () => {
      // 2028 is a leap year: Feb has 29 days, so Feb 28 → Mar 1 = 2 days
      expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    });
  });

  // ─── createCalendar ────────────────────────────────────────────────────────

  describe('createCalendar', () => {
    it('creates and returns a saved calendar', async () => {
      const dto = {
        name: 'test',
        cycleLength: 7,
        rewardDays: [{ day: 1, label: 'Day 1', reward: { coins: 10 } }],
      };
      calendarRepo.save.mockResolvedValue({ ...dto, id: 'new-id' });

      const result = await service.createCalendar(dto);

      expect(calendarRepo.create).toHaveBeenCalled();
      expect(calendarRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('new-id');
    });

    it('throws BadRequestException when a rewardDay.day exceeds cycleLength', async () => {
      await expect(
        service.createCalendar({
          name: 'bad',
          cycleLength: 5,
          rewardDays: [{ day: 6, label: 'Out of bounds', reward: {} }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('defaults resetOnMissDays to 1 when not supplied', async () => {
      calendarRepo.save.mockResolvedValue({ id: 'c1', resetOnMissDays: 1 } as {
        id: string;
      });

      await service.createCalendar({
        name: 'def',
        cycleLength: 7,
        rewardDays: [],
      });

      const created = calendarRepo.create.mock.calls[0][0] as {
        resetOnMissDays: number;
      };
      expect(created.resetOnMissDays).toBe(1);
    });
  });

  // ─── claimDailyReward – first claim ───────────────────────────────────────

  describe('claimDailyReward – first ever claim', () => {
    const today = '2026-10-22';
    let todaySpy: jest.SpyInstance;

    beforeEach(() => {
      todaySpy = jest
        .spyOn(ServiceModule, 'todayInTimezone')
        .mockReturnValue(today);

      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      streakRepo.findOne.mockResolvedValue(null);
      streakRepo.save.mockImplementation((s: PlayerLoginStreak) =>
        Promise.resolve({ ...s, id: 'streak-1' }),
      );
      claimRepo.findOne.mockResolvedValue(null);
      claimRepo.count.mockResolvedValue(0);
      claimRepo.save.mockImplementation((c: PlayerLoginRewardClaim) =>
        Promise.resolve({ ...c, id: 'claim-1' }),
      );
    });

    afterEach(() => todaySpy.mockRestore());

    it('returns success with dayNumber 1 and the day-1 reward', async () => {
      const result = await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      expect(result.success).toBe(true);
      expect(result.alreadyClaimed).toBe(false);
      expect(result.cycleReset).toBe(false);
      expect(result.dayNumber).toBe(1);
      expect(result.reward).toEqual({ coins: 10 });
      expect(result.totalClaims).toBe(1);
    });

    it('persists the claim with calendarDate = today', async () => {
      await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      const savedClaim = claimRepo.save.mock.calls[0][0] as {
        calendarDate: string;
        dayNumber: number;
        userId: string;
      };
      expect(savedClaim.calendarDate).toBe(today);
      expect(savedClaim.dayNumber).toBe(1);
      expect(savedClaim.userId).toBe(USER_ID);
    });

    it('increments totalClaims on the streak', async () => {
      await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      const lastStreakSave = streakRepo.save.mock.calls[
        streakRepo.save.mock.calls.length - 1
      ][0] as { totalClaims: number; lastClaimDate: string };
      expect(lastStreakSave.totalClaims).toBe(1);
      expect(lastStreakSave.lastClaimDate).toBe(today);
    });
  });

  // ─── claimDailyReward – idempotency ───────────────────────────────────────

  describe('claimDailyReward – idempotency (already claimed today)', () => {
    const today = '2026-10-22';
    let todaySpy: jest.SpyInstance;

    beforeEach(() => {
      todaySpy = jest
        .spyOn(ServiceModule, 'todayInTimezone')
        .mockReturnValue(today);

      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      claimRepo.findOne.mockResolvedValue({
        id: 'existing-claim',
        userId: USER_ID,
        calendarId: CALENDAR_ID,
        calendarDate: today,
        dayNumber: 1,
        rewardSnapshot: { coins: 10 },
      });
      streakRepo.findOne.mockResolvedValue(
        makeStreak({ lastClaimDate: today, currentDay: 1, totalClaims: 1 }),
      );
    });

    afterEach(() => todaySpy.mockRestore());

    it('returns alreadyClaimed: true without saving a new claim', async () => {
      const result = await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      expect(result.alreadyClaimed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.dayNumber).toBe(1);
      expect(claimRepo.save).not.toHaveBeenCalled();
    });
  });

  // ─── claimDailyReward – consecutive day advance ───────────────────────────

  describe('claimDailyReward – consecutive day advances the cycle', () => {
    const yesterday = '2026-10-21';
    const today = '2026-10-22';
    let todaySpy: jest.SpyInstance;

    beforeEach(() => {
      todaySpy = jest
        .spyOn(ServiceModule, 'todayInTimezone')
        .mockReturnValue(today);

      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      claimRepo.findOne.mockResolvedValue(null);
      claimRepo.count.mockResolvedValue(0);
      claimRepo.save.mockImplementation((c: PlayerLoginRewardClaim) =>
        Promise.resolve({ ...c, id: 'claim-2' }),
      );
      streakRepo.findOne.mockResolvedValue(
        makeStreak({ lastClaimDate: yesterday, currentDay: 1, totalClaims: 1 }),
      );
      streakRepo.save.mockImplementation((s: PlayerLoginStreak) =>
        Promise.resolve({ ...s }),
      );
    });

    afterEach(() => todaySpy.mockRestore());

    it('advances to day 2 when last claim was yesterday', async () => {
      const result = await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      expect(result.dayNumber).toBe(2);
      expect(result.cycleReset).toBe(false);
      expect(result.reward).toEqual({ coins: 20 });
    });
  });

  // ─── claimDailyReward – cycle wraps around ────────────────────────────────

  describe('claimDailyReward – cycle wraps at cycleLength', () => {
    const yesterday = '2026-10-21';
    const today = '2026-10-22';
    let todaySpy: jest.SpyInstance;

    beforeEach(() => {
      todaySpy = jest
        .spyOn(ServiceModule, 'todayInTimezone')
        .mockReturnValue(today);

      calendarRepo.findOne.mockResolvedValue(makeCalendar({ cycleLength: 7 }));
      claimRepo.findOne.mockResolvedValue(null);
      claimRepo.count.mockResolvedValue(0);
      claimRepo.save.mockImplementation((c: PlayerLoginRewardClaim) =>
        Promise.resolve({ ...c, id: 'claim-wrap' }),
      );
      // Player is on day 7 (last day of cycle)
      streakRepo.findOne.mockResolvedValue(
        makeStreak({ lastClaimDate: yesterday, currentDay: 7, totalClaims: 6 }),
      );
      streakRepo.save.mockImplementation((s: PlayerLoginStreak) =>
        Promise.resolve({ ...s }),
      );
    });

    afterEach(() => todaySpy.mockRestore());

    it('wraps back to day 1 after day 7', async () => {
      const result = await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      expect(result.dayNumber).toBe(1);
      expect(result.cycleReset).toBe(false);
    });
  });

  // ─── claimDailyReward – missed day resets cycle ───────────────────────────

  describe('claimDailyReward – missed day resets the cycle', () => {
    const twoDaysAgo = '2026-10-20';
    const today = '2026-10-22';
    let todaySpy: jest.SpyInstance;

    beforeEach(() => {
      todaySpy = jest
        .spyOn(ServiceModule, 'todayInTimezone')
        .mockReturnValue(today);

      // resetOnMissDays: 1 — any missed day triggers reset
      calendarRepo.findOne.mockResolvedValue(
        makeCalendar({ resetOnMissDays: 1 }),
      );
      claimRepo.findOne.mockResolvedValue(null);
      claimRepo.count.mockResolvedValue(0);
      claimRepo.save.mockImplementation((c: PlayerLoginRewardClaim) =>
        Promise.resolve({ ...c, id: 'claim-reset' }),
      );
      // Player was on day 5, last claimed 2 days ago → missed 1 day
      streakRepo.findOne.mockResolvedValue(
        makeStreak({
          lastClaimDate: twoDaysAgo,
          currentDay: 5,
          totalClaims: 4,
        }),
      );
      streakRepo.save.mockImplementation((s: PlayerLoginStreak) =>
        Promise.resolve({ ...s }),
      );
    });

    afterEach(() => todaySpy.mockRestore());

    it('resets cycleReset: true and goes back to day 1', async () => {
      const result = await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      expect(result.cycleReset).toBe(true);
      expect(result.dayNumber).toBe(1);
    });

    it('saves the claim at day 1 after a reset', async () => {
      await service.claimDailyReward(USER_ID, CALENDAR_ID, { timezone: 'UTC' });

      const savedClaim = claimRepo.save.mock.calls[0][0] as {
        dayNumber: number;
      };
      expect(savedClaim.dayNumber).toBe(1);
    });
  });

  // ─── claimDailyReward – configurable resetOnMissDays ─────────────────────

  describe('claimDailyReward – resetOnMissDays > 1', () => {
    const fiveDaysAgo = '2026-10-17';
    const today = '2026-10-22';
    let todaySpy: jest.SpyInstance;

    beforeEach(() => {
      todaySpy = jest
        .spyOn(ServiceModule, 'todayInTimezone')
        .mockReturnValue(today);
    });

    afterEach(() => todaySpy.mockRestore());

    it('does NOT reset when missed days < resetOnMissDays', async () => {
      // resetOnMissDays: 5 — player missed 4 days (fiveDaysAgo → today = gap of 5, missed = 4)
      calendarRepo.findOne.mockResolvedValue(
        makeCalendar({ resetOnMissDays: 5 }),
      );
      claimRepo.findOne.mockResolvedValue(null);
      claimRepo.count.mockResolvedValue(0);
      claimRepo.save.mockImplementation((c: PlayerLoginRewardClaim) =>
        Promise.resolve({ ...c, id: 'claim-no-reset' }),
      );
      streakRepo.findOne.mockResolvedValue(
        makeStreak({
          lastClaimDate: fiveDaysAgo,
          currentDay: 3,
          totalClaims: 2,
        }),
      );
      streakRepo.save.mockImplementation((s: PlayerLoginStreak) =>
        Promise.resolve({ ...s }),
      );

      const result = await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      expect(result.cycleReset).toBe(false);
      expect(result.dayNumber).toBe(4); // advanced from 3
    });

    it('DOES reset when missed days >= resetOnMissDays', async () => {
      // resetOnMissDays: 3 — player missed 4 days → should reset
      calendarRepo.findOne.mockResolvedValue(
        makeCalendar({ resetOnMissDays: 3 }),
      );
      claimRepo.findOne.mockResolvedValue(null);
      claimRepo.count.mockResolvedValue(0);
      claimRepo.save.mockImplementation((c: PlayerLoginRewardClaim) =>
        Promise.resolve({ ...c, id: 'claim-reset2' }),
      );
      streakRepo.findOne.mockResolvedValue(
        makeStreak({
          lastClaimDate: fiveDaysAgo,
          currentDay: 3,
          totalClaims: 2,
        }),
      );
      streakRepo.save.mockImplementation((s: PlayerLoginStreak) =>
        Promise.resolve({ ...s }),
      );

      const result = await service.claimDailyReward(USER_ID, CALENDAR_ID, {
        timezone: 'UTC',
      });

      expect(result.cycleReset).toBe(true);
      expect(result.dayNumber).toBe(1);
    });
  });

  // ─── claimDailyReward – inactive calendar ─────────────────────────────────

  describe('claimDailyReward – inactive calendar', () => {
    it('throws BadRequestException when calendar is not active', async () => {
      calendarRepo.findOne.mockResolvedValue(makeCalendar({ isActive: false }));

      await expect(
        service.claimDailyReward(USER_ID, CALENDAR_ID, { timezone: 'UTC' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── claimDailyReward – invalid timezone ──────────────────────────────────

  describe('claimDailyReward – invalid timezone', () => {
    it('throws BadRequestException for an invalid timezone string', async () => {
      calendarRepo.findOne.mockResolvedValue(makeCalendar());

      await expect(
        service.claimDailyReward(USER_ID, CALENDAR_ID, {
          timezone: 'Bad/Zone',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findCalendarOrThrow ───────────────────────────────────────────────────

  describe('findCalendarOrThrow', () => {
    it('returns the calendar when found', async () => {
      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      const result = await service.findCalendarOrThrow(CALENDAR_ID);
      expect(result.id).toBe(CALENDAR_ID);
    });

    it('throws NotFoundException when calendar does not exist', async () => {
      calendarRepo.findOne.mockResolvedValue(null);
      await expect(service.findCalendarOrThrow('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getStatus ────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    const today = '2026-10-22';
    let todaySpy: jest.SpyInstance;

    beforeEach(() => {
      todaySpy = jest
        .spyOn(ServiceModule, 'todayInTimezone')
        .mockReturnValue(today);
    });

    afterEach(() => todaySpy.mockRestore());

    it('reports alreadyClaimedToday: true when a claim exists for today', async () => {
      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      streakRepo.findOne.mockResolvedValue(
        makeStreak({ lastClaimDate: today, currentDay: 1, totalClaims: 1 }),
      );
      claimRepo.count.mockResolvedValue(1);

      const status = await service.getStatus(USER_ID, CALENDAR_ID, 'UTC');

      expect(status.alreadyClaimedToday).toBe(true);
      expect(status.currentDay).toBe(1);
      expect(status.todayDate).toBe(today);
    });

    it('reports alreadyClaimedToday: false when no claim today', async () => {
      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      streakRepo.findOne.mockResolvedValue(null);
      streakRepo.save.mockImplementation((s: PlayerLoginStreak) =>
        Promise.resolve({ ...s, id: 'new-streak' }),
      );
      claimRepo.count.mockResolvedValue(0);

      const status = await service.getStatus(USER_ID, CALENDAR_ID, 'UTC');

      expect(status.alreadyClaimedToday).toBe(false);
    });

    it('shows the correct nextReward for the next unclaimed day', async () => {
      calendarRepo.findOne.mockResolvedValue(makeCalendar());
      streakRepo.findOne.mockResolvedValue(
        makeStreak({ lastClaimDate: null, currentDay: 1, totalClaims: 0 }),
      );
      claimRepo.count.mockResolvedValue(0);

      const status = await service.getStatus(USER_ID, CALENDAR_ID, 'UTC');

      // Day 1 reward: { coins: 10 }
      expect(status.nextReward?.reward).toEqual({ coins: 10 });
    });
  });

  // ─── getClaimHistory ──────────────────────────────────────────────────────

  describe('getClaimHistory', () => {
    it('returns claims ordered by claimedAt DESC', async () => {
      const claims = [
        { id: 'c2', calendarDate: '2026-10-22', dayNumber: 2 },
        { id: 'c1', calendarDate: '2026-10-21', dayNumber: 1 },
      ];
      claimRepo.find.mockResolvedValue(claims);

      const result = await service.getClaimHistory(USER_ID, CALENDAR_ID);

      expect(claimRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER_ID, calendarId: CALENDAR_ID },
          order: { claimedAt: 'DESC' },
        }),
      );
      expect(result).toHaveLength(2);
    });
  });
});
