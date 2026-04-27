import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupportTicketService } from '../support-ticket.service';
import { SupportTicket, TicketCategory, TicketStatus } from '../entities/support-ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { NotificationService } from '../../notifications/notification.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeTicket = (overrides: Partial<SupportTicket> = {}): SupportTicket => ({
  id: 'ticket-1',
  playerId: 'player-1',
  category: TicketCategory.BUG,
  subject: 'Game crashes on level 3',
  description: 'Every time I reach level 3 the game freezes.',
  status: TicketStatus.OPEN,
  assignedTo: undefined,
  messages: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const mockTicketRepo = () => ({
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn((d) => Promise.resolve({ ...d, id: d.id ?? 'ticket-new' })),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockMessageRepo = () => ({
  create: jest.fn((d) => ({ ...d })),
  save: jest.fn((d) => Promise.resolve({ ...d, id: 'msg-1' })),
});

const mockNotificationService = {
  createNotificationForUsers: jest.fn().mockResolvedValue(undefined),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('SupportTicketService', () => {
  let service: SupportTicketService;
  let ticketRepo: ReturnType<typeof mockTicketRepo>;
  let messageRepo: ReturnType<typeof mockMessageRepo>;

  beforeEach(async () => {
    ticketRepo = mockTicketRepo();
    messageRepo = mockMessageRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportTicketService,
        { provide: getRepositoryToken(SupportTicket), useValue: ticketRepo },
        { provide: getRepositoryToken(TicketMessage), useValue: messageRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<SupportTicketService>(SupportTicketService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── createTicket ──────────────────────────────────────────────────────────

  describe('createTicket', () => {
    it('should create and return a new ticket', async () => {
      const dto = {
        category: TicketCategory.BUG,
        subject: 'Game crashes',
        description: 'Crash on level 3 every time.',
      };

      const result = await service.createTicket('player-1', dto);

      expect(ticketRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 'player-1',
          category: TicketCategory.BUG,
          status: TicketStatus.OPEN,
        }),
      );
      expect(ticketRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  // ─── addMessage ────────────────────────────────────────────────────────────

  describe('addMessage', () => {
    it('should add a player message to their own ticket', async () => {
      const ticket = makeTicket();
      ticketRepo.findOne.mockResolvedValue(ticket);

      const dto = { body: 'Still happening after the update.' };
      const msg = await service.addMessage('ticket-1', 'player-1', false, dto);

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ticketId: 'ticket-1', isStaff: false }),
      );
      expect(messageRepo.save).toHaveBeenCalled();
      expect(msg.id).toBe('msg-1');
    });

    it('should send in-app notification to player when staff replies', async () => {
      const ticket = makeTicket();
      ticketRepo.findOne.mockResolvedValue(ticket);

      await service.addMessage('ticket-1', 'staff-99', true, { body: 'We are looking into it.' });

      expect(mockNotificationService.createNotificationForUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: ['player-1'],
          type: 'support_ticket_staff_replied',
        }),
      );
    });

    it('should throw ForbiddenException when player tries to message another player ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(makeTicket({ playerId: 'player-99' }));

      await expect(
        service.addMessage('ticket-1', 'player-1', false, { body: 'Hello' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      ticketRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addMessage('bad-id', 'player-1', false, { body: 'Hello' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reopen a resolved ticket when the player replies', async () => {
      const ticket = makeTicket({ status: TicketStatus.RESOLVED });
      ticketRepo.findOne.mockResolvedValue(ticket);

      await service.addMessage('ticket-1', 'player-1', false, { body: 'Still broken.' });

      expect(ticketRepo.update).toHaveBeenCalledWith('ticket-1', {
        status: TicketStatus.OPEN,
      });
    });
  });

  // ─── updateTicket ──────────────────────────────────────────────────────────

  describe('updateTicket', () => {
    it('should update ticket status and assignedTo', async () => {
      const ticket = makeTicket();
      ticketRepo.findOne.mockResolvedValue(ticket);
      ticketRepo.save.mockResolvedValue({ ...ticket, status: TicketStatus.IN_PROGRESS, assignedTo: 'agent-1' });

      const result = await service.updateTicket('ticket-1', 'agent-1', {
        status: TicketStatus.IN_PROGRESS,
        assignedTo: 'agent-1',
      });

      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
      expect(result.assignedTo).toBe('agent-1');
    });

    it('should send in-app notification to player on status change', async () => {
      const ticket = makeTicket({ status: TicketStatus.OPEN });
      ticketRepo.findOne.mockResolvedValue(ticket);
      ticketRepo.save.mockResolvedValue({ ...ticket, status: TicketStatus.RESOLVED });

      await service.updateTicket('ticket-1', 'agent-1', { status: TicketStatus.RESOLVED });

      expect(mockNotificationService.createNotificationForUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          userIds: ['player-1'],
          type: 'support_ticket_status_changed',
        }),
      );
    });

    it('should throw NotFoundException for unknown ticket', async () => {
      ticketRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateTicket('bad-id', 'agent-1', { status: TicketStatus.CLOSED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getTickets (visibility isolation) ────────────────────────────────────

  describe('getTickets - player visibility isolation', () => {
    it('should scope query to playerId for non-staff requesters', async () => {
      ticketRepo.findAndCount.mockResolvedValue([[makeTicket()], 1]);

      await service.getTickets('player-1', false, { page: 1, limit: 20 });

      expect(ticketRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ playerId: 'player-1' }),
        }),
      );
    });

    it('should NOT scope query to a specific player for staff', async () => {
      ticketRepo.findAndCount.mockResolvedValue([[makeTicket()], 1]);

      await service.getTickets('staff-1', true, { page: 1, limit: 20 });

      const callArg = ticketRepo.findAndCount.mock.calls[0][0];
      expect(callArg.where).not.toHaveProperty('playerId');
    });
  });

  // ─── getTickets (staff filters) ───────────────────────────────────────────

  describe('getTickets - staff filter queries', () => {
    it('should apply status filter for staff', async () => {
      ticketRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getTickets('staff-1', true, {
        page: 1,
        limit: 20,
        status: TicketStatus.OPEN,
      });

      expect(ticketRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TicketStatus.OPEN }),
        }),
      );
    });

    it('should apply category filter for staff', async () => {
      ticketRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getTickets('staff-1', true, {
        page: 1,
        limit: 20,
        category: TicketCategory.BILLING,
      });

      expect(ticketRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: TicketCategory.BILLING }),
        }),
      );
    });

    it('should apply assignee filter for staff', async () => {
      ticketRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getTickets('staff-1', true, {
        page: 1,
        limit: 20,
        assignee: 'agent-5',
      });

      expect(ticketRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedTo: 'agent-5' }),
        }),
      );
    });
  });

  // ─── getStats ─────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('should return openCount, avgResolutionTimeSeconds, and ticketsByCategory', async () => {
      ticketRepo.count.mockResolvedValue(7);

      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgSeconds: '3600' }),
        getRawMany: jest.fn().mockResolvedValue([
          { category: 'bug', count: '5' },
          { category: 'billing', count: '2' },
        ]),
      };
      ticketRepo.createQueryBuilder.mockReturnValue(mockQb);

      const stats = await service.getStats();

      expect(stats.openCount).toBe(7);
      expect(stats.avgResolutionTimeSeconds).toBe(3600);
      expect(stats.ticketsByCategory).toEqual({ bug: 5, billing: 2 });
    });

    it('should return 0 for avgResolutionTimeSeconds when no resolved tickets', async () => {
      ticketRepo.count.mockResolvedValue(0);

      const mockQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgSeconds: null }),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      ticketRepo.createQueryBuilder.mockReturnValue(mockQb);

      const stats = await service.getStats();

      expect(stats.avgResolutionTimeSeconds).toBe(0);
      expect(stats.ticketsByCategory).toEqual({});
    });
  });
});
