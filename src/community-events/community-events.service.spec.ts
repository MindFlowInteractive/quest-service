import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommunityEventsService } from './community-events.service';
import { CommunityEvent, CommunityEventStatus, CommunityEventPhase } from './entities/community-event.entity';
import { EventParticipation } from './entities/event-participation.entity';
import { EventMilestone } from './entities/event-milestone.entity';

const mockRepo = () => ({
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ ...d, id: d.id ?? 'generated-id' })),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  increment: jest.fn().mockResolvedValue(undefined),
});

const baseEvent = (): CommunityEvent => ({
  id: 'event-1',
  name: 'Test Event',
  description: 'A test community event',
  theme: 'general',
  startDate: new Date(Date.now() - 1000),
  endDate: new Date(Date.now() + 86400000),
  status: CommunityEventStatus.ACTIVE,
  currentPhase: CommunityEventPhase.MAIN,
  participantCount: 0,
  analytics: { totalActionsPerformed: 0, dailyParticipants: {} },
  exclusiveRewards: [],
  rewardsDistributed: false,
  isPublished: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  participations: [],
  milestones: [],
});

const baseMilestone = (): EventMilestone => ({
  id: 'milestone-1',
  eventId: 'event-1',
  name: 'First Steps',
  description: 'Complete your first action',
  requiredScore: 100,
  reward: { type: 'badge', name: 'Trailblazer', value: 0 },
  isActive: true,
  claimedCount: 0,
  displayOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  event: {} as any,
});

describe('CommunityEventsService', () => {
  let service: CommunityEventsService;
  let eventRepo: ReturnType<typeof mockRepo>;
  let participationRepo: ReturnType<typeof mockRepo>;
  let milestoneRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    eventRepo = mockRepo();
    participationRepo = mockRepo();
    milestoneRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityEventsService,
        { provide: getRepositoryToken(CommunityEvent), useValue: eventRepo },
        { provide: getRepositoryToken(EventParticipation), useValue: participationRepo },
        { provide: getRepositoryToken(EventMilestone), useValue: milestoneRepo },
      ],
    }).compile();

    service = module.get<CommunityEventsService>(CommunityEventsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a scheduled event successfully', async () => {
      const dto = {
        name: 'Spring Bash',
        description: 'Spring community event',
        startDate: new Date(Date.now() + 1000),
        endDate: new Date(Date.now() + 86400000),
      };
      eventRepo.create.mockReturnValue({ ...dto, id: 'new-id' });
      eventRepo.save.mockResolvedValue({ ...dto, id: 'new-id', status: CommunityEventStatus.SCHEDULED });

      const result = await service.create(dto as any);
      expect(result.status).toBe(CommunityEventStatus.SCHEDULED);
    });

    it('rejects when startDate >= endDate', async () => {
      const now = new Date();
      await expect(
        service.create({
          name: 'Bad Event',
          description: 'desc',
          startDate: now,
          endDate: now,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the event when found', async () => {
      eventRepo.findOne.mockResolvedValue(baseEvent());
      const result = await service.findOne('event-1');
      expect(result.id).toBe('event-1');
    });

    it('throws NotFoundException when event does not exist', async () => {
      eventRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── recordParticipation ─────────────────────────────────────────────────

  describe('recordParticipation', () => {
    it('creates a new participation record on first join', async () => {
      eventRepo.findOne.mockResolvedValue(baseEvent());
      participationRepo.findOne.mockResolvedValue(null);
      participationRepo.count.mockResolvedValue(0);
      milestoneRepo.find.mockResolvedValue([]);
      const savedParticipation: Partial<EventParticipation> = {
        id: 'part-1',
        userId: 'user-1',
        eventId: 'event-1',
        score: 50,
        actionsPerformed: 1,
        milestonesReached: [],
        rewardsEarned: [],
        isVerified: true,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
      };
      participationRepo.create.mockReturnValue(savedParticipation);
      participationRepo.save.mockResolvedValue(savedParticipation);

      const result = await service.recordParticipation('event-1', {
        userId: 'user-1',
        score: 50,
      });
      expect(result.score).toBe(50);
      expect(eventRepo.increment).toHaveBeenCalledWith({ id: 'event-1' }, 'participantCount', 1);
    });

    it('rejects participation on an inactive event', async () => {
      const inactiveEvent = { ...baseEvent(), status: CommunityEventStatus.COMPLETED };
      eventRepo.findOne.mockResolvedValue(inactiveEvent);

      await expect(
        service.recordParticipation('event-1', { userId: 'user-1', score: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when event is at max capacity', async () => {
      const fullEvent = { ...baseEvent(), maxParticipants: 5 };
      eventRepo.findOne.mockResolvedValue(fullEvent);
      participationRepo.count.mockResolvedValue(5);

      await expect(
        service.recordParticipation('event-1', { userId: 'user-new', score: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('awards milestone when score threshold is crossed', async () => {
      const existing: Partial<EventParticipation> = {
        id: 'part-1',
        userId: 'user-1',
        eventId: 'event-1',
        score: 50,
        actionsPerformed: 1,
        milestonesReached: [],
        rewardsEarned: [],
        isVerified: false,
        lastActivityAt: new Date(),
      };
      eventRepo.findOne.mockResolvedValue(baseEvent());
      participationRepo.findOne.mockResolvedValueOnce(existing);
      milestoneRepo.find.mockResolvedValue([baseMilestone()]);
      participationRepo.save.mockImplementation((d) => Promise.resolve(d));

      // Score goes from 50 → 100 which should trigger the milestone
      existing.score = 100;

      await service.recordParticipation('event-1', { userId: 'user-1', score: 50 });
      expect(milestoneRepo.increment).toHaveBeenCalledWith(
        { id: 'milestone-1' },
        'claimedCount',
        1,
      );
    });
  });

  // ─── getLeaderboard ──────────────────────────────────────────────────────

  describe('getLeaderboard', () => {
    it('returns ranked entries sorted by score', async () => {
      eventRepo.findOne.mockResolvedValue(baseEvent());
      participationRepo.find.mockResolvedValue([
        { userId: 'u1', score: 200, actionsPerformed: 5, milestonesReached: [], lastActivityAt: new Date() },
        { userId: 'u2', score: 100, actionsPerformed: 3, milestonesReached: [], lastActivityAt: new Date() },
      ]);

      const result = await service.getLeaderboard('event-1', 10);
      expect(result[0].rank).toBe(1);
      expect(result[0].userId).toBe('u1');
      expect(result[1].rank).toBe(2);
    });
  });

  // ─── getAnalytics ────────────────────────────────────────────────────────

  describe('getAnalytics', () => {
    it('calculates analytics correctly', async () => {
      const event = { ...baseEvent(), analytics: { totalActionsPerformed: 10, dailyParticipants: { '2025-12-01': 3 } } };
      eventRepo.findOne.mockResolvedValue(event);
      participationRepo.find.mockResolvedValue([
        { score: 200, milestonesReached: [{ milestoneId: 'milestone-1' }] },
        { score: 100, milestonesReached: [] },
      ]);
      milestoneRepo.find.mockResolvedValue([baseMilestone()]);

      const analytics = await service.getAnalytics('event-1');
      expect(analytics.participantCount).toBe(0);
      expect(analytics.averageScore).toBe(150);
      expect(analytics.milestoneCompletionRates[0].participantsReached).toBe(1);
      expect(analytics.totalActionsPerformed).toBe(10);
    });
  });

  // ─── addMilestone ────────────────────────────────────────────────────────

  describe('addMilestone', () => {
    it('creates a milestone for an existing event', async () => {
      eventRepo.findOne.mockResolvedValue(baseEvent());
      const milestone = baseMilestone();
      milestoneRepo.create.mockReturnValue(milestone);
      milestoneRepo.save.mockResolvedValue(milestone);

      const result = await service.addMilestone('event-1', {
        name: 'First Steps',
        requiredScore: 100,
        reward: { type: 'badge', name: 'Trailblazer' },
      } as any);

      expect(result.name).toBe('First Steps');
    });
  });

  // ─── distributeEndRewards ────────────────────────────────────────────────

  describe('distributeEndRewards', () => {
    it('skips distribution when rewards already distributed', async () => {
      const event = { ...baseEvent(), rewardsDistributed: true };
      eventRepo.findOne.mockResolvedValue(event);

      await service.distributeEndRewards('event-1');
      expect(participationRepo.find).not.toHaveBeenCalled();
    });

    it('distributes rewards to top-ranked participants', async () => {
      const event = {
        ...baseEvent(),
        rewardsDistributed: false,
        exclusiveRewards: [{ rewardId: 'r1', name: 'Champion Badge', type: 'badge', rank: 1 }],
      };
      eventRepo.findOne.mockResolvedValue(event);

      // getLeaderboard calls
      participationRepo.find
        .mockResolvedValueOnce([
          { userId: 'u1', score: 300, actionsPerformed: 10, milestonesReached: [], lastActivityAt: new Date() },
        ])
        // getParticipation for distribution
        .mockResolvedValueOnce([
          { userId: 'u1', score: 300, actionsPerformed: 10, milestonesReached: [], lastActivityAt: new Date() },
        ]);

      const savedPart = { userId: 'u1', eventId: 'event-1', rewardsEarned: [], isVerified: true };
      participationRepo.findOne.mockResolvedValue(savedPart);
      participationRepo.save.mockResolvedValue(savedPart);

      await service.distributeEndRewards('event-1');
      expect(participationRepo.save).toHaveBeenCalled();
    });
  });
});
