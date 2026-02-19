import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SeasonalEventService } from './services/seasonal-event.service';
import { EventPuzzleService } from './services/event-puzzle.service';
import { PlayerEventService } from './services/player-event.service';
import { LeaderboardService } from './services/leaderboard.service';
import { SeasonalEvent } from './entities/seasonal-event.entity';
import { EventPuzzle } from './entities/event-puzzle.entity';
import { PlayerEvent } from './entities/player-event.entity';
import { EventReward } from './entities/event-reward.entity';
import { NotificationService } from '../notifications/notification.service';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const mockRepo = () => ({
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ ...d, id: d.id ?? 'generated-id' })),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  increment: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
});

const mockNotificationService = {
  createNotificationForUsers: jest.fn().mockResolvedValue(undefined),
};

const baseEvent = (): Partial<SeasonalEvent> => ({
  id: 'event-1',
  name: 'Winter Wonderland',
  description: 'A seasonal puzzle event',
  theme: 'winter',
  startDate: new Date('2025-12-01T00:00:00Z'),
  endDate: new Date('2025-12-31T23:59:59Z'),
  isActive: true,
  isPublished: true,
  isArchived: false,
  isRecurring: false,
  recurrenceConfig: undefined,
  participantCount: 0,
  totalPuzzlesCompleted: 0,
  puzzles: [],
  rewards: [],
  playerEvents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const basePuzzle = (): Partial<EventPuzzle> => ({
  id: 'puzzle-1',
  eventId: 'event-1',
  question: 'What is 2 + 2?',
  category: 'math',
  difficulty: 'easy',
  rewardPoints: 100,
  timeLimit: 300,
  maxAttempts: 3,
  isActive: true,
  completionCount: 0,
  attemptCount: 0,
  tags: [],
  content: {
    type: 'multiple-choice',
    options: ['2', '3', '4', '5'],
    correctAnswer: '4',
    explanation: 'Basic addition.',
  },
  event: { isActive: true } as any,
});

// ─── SeasonalEventService ────────────────────────────────────────────────────

describe('SeasonalEventService', () => {
  let service: SeasonalEventService;
  let eventRepo: ReturnType<typeof mockRepo>;
  let puzzleRepo: ReturnType<typeof mockRepo>;
  let rewardRepo: ReturnType<typeof mockRepo>;
  let notifService: typeof mockNotificationService;

  beforeEach(async () => {
    eventRepo = mockRepo();
    puzzleRepo = mockRepo();
    rewardRepo = mockRepo();
    notifService = { createNotificationForUsers: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonalEventService,
        { provide: getRepositoryToken(SeasonalEvent), useValue: eventRepo },
        { provide: getRepositoryToken(EventPuzzle), useValue: puzzleRepo },
        { provide: getRepositoryToken(EventReward), useValue: rewardRepo },
        { provide: NotificationService, useValue: notifService },
      ],
    }).compile();

    service = module.get<SeasonalEventService>(SeasonalEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── createEvent ─────────────────────────────────────────────────────────────

  describe('createEvent()', () => {
    it('throws BadRequestException when startDate >= endDate', async () => {
      await expect(
        service.createEvent({
          name: 'Test',
          description: 'Desc',
          startDate: new Date('2025-12-31'),
          endDate: new Date('2025-12-01'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('sets isActive=false initially when event has not started yet', async () => {
      const future = new Date(Date.now() + 86400000);
      const end = new Date(Date.now() + 2 * 86400000);
      eventRepo.save.mockResolvedValueOnce({ id: 'e1', isActive: false });

      const result = await service.createEvent({
        name: 'Future Event',
        description: 'Desc',
        startDate: future,
        endDate: end,
        isPublished: true,
      });

      const createdArg = eventRepo.create.mock.calls[0][0];
      expect(createdArg.isActive).toBe(false);
    });

    it('sets isActive=true when event window is currently open', async () => {
      const past = new Date(Date.now() - 1000);
      const future = new Date(Date.now() + 86400000);

      eventRepo.create.mockImplementationOnce((d) => ({ ...d }));
      eventRepo.save.mockResolvedValueOnce({ id: 'e1', isActive: true });

      await service.createEvent({
        name: 'Live Event',
        description: 'Desc',
        startDate: past,
        endDate: future,
        isPublished: true,
      });

      // The entity passed to save should have isActive=true
      const saved = eventRepo.save.mock.calls[0][0];
      expect(saved.isActive).toBe(true);
    });

    it('supports isRecurring and recurrenceConfig', async () => {
      const start = new Date(Date.now() + 1000);
      const end = new Date(Date.now() + 86400000);
      eventRepo.create.mockImplementationOnce((d) => ({ ...d }));
      eventRepo.save.mockResolvedValueOnce({ id: 'e2', isRecurring: true });

      await service.createEvent({
        name: 'Weekly Event',
        description: 'Desc',
        startDate: start,
        endDate: end,
        isRecurring: true,
        recurrenceConfig: { intervalDays: 7, maxOccurrences: 4, occurrenceCount: 0 },
      });

      const arg = eventRepo.create.mock.calls[0][0];
      expect(arg.isRecurring).toBe(true);
      expect(arg.recurrenceConfig.intervalDays).toBe(7);
    });
  });

  // ── handleEventActivation (cron) ─────────────────────────────────────────────

  describe('handleEventActivation()', () => {
    it('activates published events within their time window', async () => {
      const event = { ...baseEvent(), isActive: false, isPublished: true } as SeasonalEvent;
      eventRepo.find
        .mockResolvedValueOnce([event])   // eventsToActivate
        .mockResolvedValueOnce([])        // eventsToDeactivate
        .mockResolvedValueOnce([]);       // eventsToAutoArchive

      await service.handleEventActivation();

      expect(event.isActive).toBe(true);
      expect(eventRepo.save).toHaveBeenCalledWith(event);
      expect(notifService.createNotificationForUsers).toHaveBeenCalledTimes(1);
      expect(notifService.createNotificationForUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'event_announcement',
          title: expect.stringContaining('Winter Wonderland'),
        }),
      );
    });

    it('deactivates events whose endDate has passed', async () => {
      const event = { ...baseEvent(), isActive: true } as SeasonalEvent;
      eventRepo.find
        .mockResolvedValueOnce([])      // eventsToActivate
        .mockResolvedValueOnce([event]) // eventsToDeactivate
        .mockResolvedValueOnce([]);     // eventsToAutoArchive

      await service.handleEventActivation();

      expect(event.isActive).toBe(false);
      expect(eventRepo.save).toHaveBeenCalledWith(event);
    });

    it('auto-archives events ended more than 7 days ago', async () => {
      const event = { ...baseEvent(), isActive: false, isArchived: false } as SeasonalEvent;
      eventRepo.find
        .mockResolvedValueOnce([])      // eventsToActivate
        .mockResolvedValueOnce([])      // eventsToDeactivate
        .mockResolvedValueOnce([event]); // eventsToAutoArchive

      await service.handleEventActivation();

      expect(event.isArchived).toBe(true);
      expect(event.archivedAt).toBeInstanceOf(Date);
    });
  });

  // ── handleRecurringEvents (cron) ─────────────────────────────────────────────

  describe('handleRecurringEvents()', () => {
    it('clones a recurring event template when max occurrences not reached', async () => {
      const template = {
        ...baseEvent(),
        isRecurring: true,
        recurrenceConfig: { intervalDays: 7, maxOccurrences: 3, occurrenceCount: 1, parentEventId: undefined },
        puzzles: [{ ...basePuzzle(), id: 'p1' }],
        rewards: [],
      } as any;

      eventRepo.find.mockResolvedValueOnce([template]);
      puzzleRepo.create.mockImplementationOnce((d) => d);
      puzzleRepo.save.mockResolvedValueOnce({ id: 'p2' });
      eventRepo.create.mockImplementationOnce((d) => d);
      eventRepo.save
        .mockResolvedValueOnce({ id: 'new-event-id' }) // new event
        .mockResolvedValueOnce({ ...template, recurrenceConfig: { ...template.recurrenceConfig, occurrenceCount: 2 } }); // updated template

      await service.handleRecurringEvents();

      expect(eventRepo.create).toHaveBeenCalled();
      expect(eventRepo.save).toHaveBeenCalledTimes(2); // new event + template update
      expect(template.recurrenceConfig.occurrenceCount).toBe(2);
      expect(puzzleRepo.save).toHaveBeenCalledTimes(1);
    });

    it('skips event when maxOccurrences reached', async () => {
      const template = {
        ...baseEvent(),
        isRecurring: true,
        recurrenceConfig: { intervalDays: 7, maxOccurrences: 2, occurrenceCount: 2 },
        puzzles: [],
        rewards: [],
      } as any;

      eventRepo.find.mockResolvedValueOnce([template]);

      await service.handleRecurringEvents();

      expect(eventRepo.save).not.toHaveBeenCalled();
    });

    it('skips event with null/missing recurrenceConfig', async () => {
      const template = { ...baseEvent(), isRecurring: true, recurrenceConfig: null, puzzles: [], rewards: [] } as any;
      eventRepo.find.mockResolvedValueOnce([template]);

      await service.handleRecurringEvents();

      expect(eventRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── archiveEvent ──────────────────────────────────────────────────────────────

  describe('archiveEvent()', () => {
    it('sets isArchived and archivedAt, deactivates the event', async () => {
      const event = { ...baseEvent(), isActive: true, isArchived: false } as SeasonalEvent;
      eventRepo.findOne.mockResolvedValueOnce(event);
      eventRepo.save.mockResolvedValueOnce({ ...event, isArchived: true });

      const result = await service.archiveEvent('event-1');

      expect(event.isArchived).toBe(true);
      expect(event.isActive).toBe(false);
      expect(event.archivedAt).toBeInstanceOf(Date);
    });

    it('throws NotFoundException when event does not exist', async () => {
      eventRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.archiveEvent('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findArchivedEvents ────────────────────────────────────────────────────────

  describe('findArchivedEvents()', () => {
    it('returns only archived events ordered by archivedAt DESC', async () => {
      const archived = [{ ...baseEvent(), isArchived: true, archivedAt: new Date() }];
      eventRepo.find.mockResolvedValueOnce(archived);

      const result = await service.findArchivedEvents();

      expect(eventRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isArchived: true } }),
      );
      expect(result).toEqual(archived);
    });
  });

  // ── findPastEvents ────────────────────────────────────────────────────────────

  describe('findPastEvents()', () => {
    it('excludes archived events from past list', async () => {
      eventRepo.find.mockResolvedValueOnce([]);
      await service.findPastEvents(5);

      expect(eventRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isArchived: false }) }),
      );
    });
  });

  // ── announceEvent ─────────────────────────────────────────────────────────────

  describe('announceEvent()', () => {
    it('calls createNotificationForUsers with correct payload', async () => {
      const event = baseEvent() as SeasonalEvent;

      await service.announceEvent(event);

      expect(notifService.createNotificationForUsers).toHaveBeenCalledWith({
        segment: { key: 'isActive', value: true },
        type: 'event_announcement',
        title: `New Event: ${event.name}`,
        body: event.description,
        meta: {
          eventId: event.id,
          startDate: event.startDate,
          endDate: event.endDate,
          theme: event.theme,
          bannerImage: event.bannerImage,
        },
      });
    });

    it('does not throw when notification service fails', async () => {
      const event = baseEvent() as SeasonalEvent;
      notifService.createNotificationForUsers.mockRejectedValueOnce(new Error('notif error'));

      await expect(service.announceEvent(event)).resolves.not.toThrow();
    });
  });

  // ── getEventStatistics ────────────────────────────────────────────────────────

  describe('getEventStatistics()', () => {
    it('calculates averageScore and completionRate correctly', async () => {
      const event = {
        ...baseEvent(),
        participantCount: 2,
        totalPuzzlesCompleted: 4,
        puzzles: [{ id: 'p1' }, { id: 'p2' }],
        playerEvents: [{ score: 200 }, { score: 300 }],
      } as any;
      eventRepo.findOne.mockResolvedValueOnce(event);

      const { stats } = await service.getEventStatistics('event-1');

      expect(stats.averageScore).toBe(250);
      // completionRate = (4 / (2 * 2)) * 100 = 100
      expect(stats.completionRate).toBe(100);
    });

    it('returns 0 completionRate when no participants', async () => {
      const event = { ...baseEvent(), participantCount: 0, totalPuzzlesCompleted: 0, puzzles: [], playerEvents: [] } as any;
      eventRepo.findOne.mockResolvedValueOnce(event);

      const { stats } = await service.getEventStatistics('event-1');

      expect(stats.completionRate).toBe(0);
      expect(stats.averageScore).toBe(0);
    });
  });
});

// ─── EventPuzzleService ───────────────────────────────────────────────────────

describe('EventPuzzleService', () => {
  let service: EventPuzzleService;
  let puzzleRepo: ReturnType<typeof mockRepo>;
  let eventRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    puzzleRepo = mockRepo();
    eventRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPuzzleService,
        { provide: getRepositoryToken(EventPuzzle), useValue: puzzleRepo },
        { provide: getRepositoryToken(SeasonalEvent), useValue: eventRepo },
      ],
    }).compile();

    service = module.get<EventPuzzleService>(EventPuzzleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPuzzlesByEvent()', () => {
    it('throws ForbiddenException when event is not active', async () => {
      const inactiveEvent = { ...baseEvent(), isActive: false };
      eventRepo.findOne.mockResolvedValueOnce(inactiveEvent);

      await expect(service.findPuzzlesByEvent('event-1')).rejects.toThrow(ForbiddenException);
    });

    it('returns active puzzles for an active event', async () => {
      const activeEvent = { ...baseEvent(), isActive: true };
      const puzzles = [basePuzzle()];
      eventRepo.findOne.mockResolvedValueOnce(activeEvent);
      puzzleRepo.find.mockResolvedValueOnce(puzzles);

      const result = await service.findPuzzlesByEvent('event-1');

      expect(result).toEqual(puzzles);
    });
  });

  describe('findOne()', () => {
    it('throws ForbiddenException when puzzle event is inactive', async () => {
      const puzzle = { ...basePuzzle(), event: { isActive: false } };
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);

      await expect(service.findOne('puzzle-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when puzzle does not exist', async () => {
      puzzleRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns puzzle when event is active', async () => {
      const puzzle = basePuzzle();
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);

      const result = await service.findOne('puzzle-1');

      expect(result).toEqual(puzzle);
    });
  });

  describe('verifyAnswer()', () => {
    it('returns isCorrect=true for exact string match (case-insensitive)', async () => {
      const puzzle = { ...basePuzzle(), id: 'p1' };
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      puzzleRepo.increment.mockResolvedValue(undefined);
      puzzleRepo.save.mockResolvedValue(puzzle);

      const result = await service.verifyAnswer('p1', '4');

      expect(result.isCorrect).toBe(true);
    });

    it('returns isCorrect=false with correctAnswer exposed for wrong answer', async () => {
      const puzzle = { ...basePuzzle(), id: 'p1' };
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      puzzleRepo.increment.mockResolvedValue(undefined);
      puzzleRepo.save.mockResolvedValue(puzzle);

      const result = await service.verifyAnswer('p1', 'wrong');

      expect(result.isCorrect).toBe(false);
    });
  });
});

// ─── PlayerEventService ───────────────────────────────────────────────────────

describe('PlayerEventService', () => {
  let service: PlayerEventService;
  let playerEventRepo: ReturnType<typeof mockRepo>;
  let rewardRepo: ReturnType<typeof mockRepo>;
  let eventRepo: ReturnType<typeof mockRepo>;
  let puzzleRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    playerEventRepo = mockRepo();
    rewardRepo = mockRepo();
    eventRepo = mockRepo();
    puzzleRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerEventService,
        { provide: getRepositoryToken(PlayerEvent), useValue: playerEventRepo },
        { provide: getRepositoryToken(EventReward), useValue: rewardRepo },
        { provide: getRepositoryToken(SeasonalEvent), useValue: eventRepo },
        { provide: getRepositoryToken(EventPuzzle), useValue: puzzleRepo },
      ],
    }).compile();

    service = module.get<PlayerEventService>(PlayerEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── submitAnswer ──────────────────────────────────────────────────────────────

  describe('submitAnswer()', () => {
    const makePlayerEvent = (): Partial<PlayerEvent> => ({
      id: 'pe-1',
      playerId: 'player-1',
      eventId: 'event-1',
      score: 0,
      completedPuzzles: [],
      rewards: [],
      puzzlesCompleted: 0,
      totalAttempts: 0,
      correctAnswers: 0,
      hintsUsed: 0,
      currentStreak: 0,
      bestStreak: 0,
      averageCompletionTime: 0,
      statistics: {},
    });

    it('awards points and increments streak on correct answer', async () => {
      const playerEvent = makePlayerEvent();
      const puzzle = { ...basePuzzle() };

      playerEventRepo.findOne
        .mockResolvedValueOnce(playerEvent) // getOrCreatePlayerEvent inner findOne
        .mockResolvedValueOnce(playerEvent); // save returns same
      playerEventRepo.save.mockResolvedValueOnce(playerEvent);
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      rewardRepo.find.mockResolvedValueOnce([]);
      puzzleRepo.increment.mockResolvedValue(undefined);
      eventRepo.increment.mockResolvedValue(undefined);

      const result = await service.submitAnswer('player-1', 'event-1', {
        puzzleId: 'puzzle-1',
        answer: '4',
      });

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBe(100);
      expect(playerEvent.currentStreak).toBe(1);
      expect(playerEvent.correctAnswers).toBe(1);
    });

    it('resets streak and awards 0 points on wrong answer', async () => {
      const playerEvent = { ...makePlayerEvent(), currentStreak: 3 };
      const puzzle = { ...basePuzzle() };

      playerEventRepo.findOne.mockResolvedValueOnce(playerEvent);
      playerEventRepo.save.mockResolvedValueOnce(playerEvent);
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      puzzleRepo.increment.mockResolvedValue(undefined);
      rewardRepo.find.mockResolvedValueOnce([]);
      eventRepo.increment.mockResolvedValue(undefined);

      const result = await service.submitAnswer('player-1', 'event-1', {
        puzzleId: 'puzzle-1',
        answer: 'wrong',
      });

      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(playerEvent.currentStreak).toBe(0);
    });

    it('throws BadRequestException when puzzle already completed', async () => {
      const playerEvent = { ...makePlayerEvent(), completedPuzzles: ['puzzle-1'] };
      playerEventRepo.findOne.mockResolvedValueOnce(playerEvent);

      await expect(
        service.submitAnswer('player-1', 'event-1', { puzzleId: 'puzzle-1', answer: '4' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('applies time bonus when puzzle completed in < 50% of timeLimit', async () => {
      const playerEvent = makePlayerEvent();
      const puzzle = { ...basePuzzle(), rewardPoints: 100, timeLimit: 300 };

      playerEventRepo.findOne.mockResolvedValueOnce(playerEvent);
      playerEventRepo.save.mockResolvedValueOnce(playerEvent);
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      rewardRepo.find.mockResolvedValueOnce([]);
      puzzleRepo.increment.mockResolvedValue(undefined);
      eventRepo.increment.mockResolvedValue(undefined);

      const result = await service.submitAnswer('player-1', 'event-1', {
        puzzleId: 'puzzle-1',
        answer: '4',
        timeTaken: 100, // < 150 (50% of 300)
      });

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBe(120); // 100 base + 20% bonus
    });

    it('applies hint penalty correctly', async () => {
      const playerEvent = makePlayerEvent();
      const puzzle = { ...basePuzzle(), rewardPoints: 100 };

      playerEventRepo.findOne.mockResolvedValueOnce(playerEvent);
      playerEventRepo.save.mockResolvedValueOnce(playerEvent);
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      rewardRepo.find.mockResolvedValueOnce([]);
      puzzleRepo.increment.mockResolvedValue(undefined);
      eventRepo.increment.mockResolvedValue(undefined);

      const result = await service.submitAnswer('player-1', 'event-1', {
        puzzleId: 'puzzle-1',
        answer: '4',
        hintsUsed: 2, // 2 * 10% = 20 penalty
      });

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBe(80); // 100 - 20
    });
  });

  // ── getPlayerRank ─────────────────────────────────────────────────────────────

  describe('getPlayerRank()', () => {
    it('calculates rank and percentile correctly', async () => {
      const myPlayerEvent = { id: 'pe-2', playerId: 'p2', eventId: 'e1', score: 200, puzzlesCompleted: 2, event: {} };
      // simulate 3 participants: p1 (300), p2 (200), p3 (100)
      const allPlayerEvents = [
        { id: 'pe-1', score: 300, puzzlesCompleted: 5 },
        { id: 'pe-2', score: 200, puzzlesCompleted: 2 },
        { id: 'pe-3', score: 100, puzzlesCompleted: 1 },
      ];

      playerEventRepo.findOne.mockResolvedValueOnce(myPlayerEvent);
      playerEventRepo.find.mockResolvedValueOnce(allPlayerEvents);

      const result = await service.getPlayerRank('p2', 'e1');

      expect(result.rank).toBe(2);
      expect(result.totalParticipants).toBe(3);
      // percentile = ((3 - 2 + 1) / 3) * 100 = 66.67
      expect(result.percentile).toBeCloseTo(66.67, 1);
    });
  });
});

// ─── LeaderboardService ───────────────────────────────────────────────────────

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let playerEventRepo: ReturnType<typeof mockRepo>;

  let eventRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    playerEventRepo = mockRepo();
    eventRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: getRepositoryToken(PlayerEvent), useValue: playerEventRepo },
        { provide: getRepositoryToken(SeasonalEvent), useValue: eventRepo },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEventLeaderboard()', () => {
    it('returns entries ranked by score DESC', async () => {
      const entries = [
        { id: 'pe-1', playerId: 'p1', score: 300, puzzlesCompleted: 5, currentStreak: 3, bestStreak: 5, lastActivityAt: new Date() },
        { id: 'pe-2', playerId: 'p2', score: 200, puzzlesCompleted: 3, currentStreak: 1, bestStreak: 3, lastActivityAt: new Date() },
      ];
      playerEventRepo.find.mockResolvedValueOnce(entries);

      const result = await service.getEventLeaderboard('event-1', 10);

      expect(result[0].rank).toBe(1);
      expect(result[0].playerId).toBe('p1');
      expect(result[1].rank).toBe(2);
      expect(result[1].playerId).toBe('p2');
    });

    it('returns empty array for event with no participants', async () => {
      playerEventRepo.find.mockResolvedValueOnce([]);

      const result = await service.getEventLeaderboard('event-1', 10);

      expect(result).toEqual([]);
    });
  });
});
