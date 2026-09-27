import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountManagementService } from './account-management.service';
import {
  AccountReset,
  ResetType,
  ResetStatus,
  AccountAuditAction,
} from './entities/account-reset.entity';
import { AccountAuditTrail } from './entities/account-audit-trail.entity';
import { User } from '../users/entities/user.entity';

const mockRepo = () => ({
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ ...d, id: d.id ?? 'generated-id' })),
  findOne: jest.fn(),
  find: jest.fn(),
});

const baseUser = (): Partial<User> => ({
  id: 'user-1',
  email: 'test@example.com',
});

const pendingReset = (overrides: Partial<AccountReset> = {}): AccountReset =>
  ({
    id: 'reset-1',
    userId: 'user-1',
    resetType: ResetType.FULL_PROGRESSION,
    status: ResetStatus.PENDING,
    confirmationToken: 'abc123',
    backupSnapshot: { userId: 'user-1', capturedAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
    ...overrides,
  } as AccountReset);

describe('AccountManagementService', () => {
  let service: AccountManagementService;
  let resetRepo: ReturnType<typeof mockRepo>;
  let auditRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    resetRepo = mockRepo();
    auditRepo = mockRepo();
    userRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountManagementService,
        { provide: getRepositoryToken(AccountReset), useValue: resetRepo },
        { provide: getRepositoryToken(AccountAuditTrail), useValue: auditRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<AccountManagementService>(AccountManagementService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── requestReset ────────────────────────────────────────────────────────

  describe('requestReset', () => {
    it('creates a pending reset with a backup snapshot', async () => {
      resetRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(baseUser());
      const saved = pendingReset();
      resetRepo.create.mockReturnValue(saved);
      resetRepo.save.mockResolvedValue(saved);
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.requestReset('user-1', {
        resetType: ResetType.FULL_PROGRESSION,
      });

      expect(result.status).toBe(ResetStatus.PENDING);
      expect(result.confirmationToken).toBeDefined();
      expect(result.backupSnapshot).toBeDefined();
    });

    it('throws when a pending reset already exists', async () => {
      resetRepo.findOne.mockResolvedValue(pendingReset());

      await expect(
        service.requestReset('user-1', { resetType: ResetType.XP_ONLY }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when user does not exist', async () => {
      resetRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.requestReset('missing-user', { resetType: ResetType.XP_ONLY }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── confirmReset ────────────────────────────────────────────────────────

  describe('confirmReset', () => {
    it('completes reset when token matches and delay has passed', async () => {
      const reset = pendingReset({ createdAt: new Date(Date.now() - 10 * 60 * 1000) });
      resetRepo.findOne.mockResolvedValue(reset);
      resetRepo.save.mockImplementation((d) => Promise.resolve({ ...d, status: ResetStatus.COMPLETED }));
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.confirmReset('user-1', { confirmationToken: 'abc123' });
      expect(result.status).toBe(ResetStatus.COMPLETED);
    });

    it('throws with invalid confirmation token', async () => {
      resetRepo.findOne.mockResolvedValue(pendingReset({ createdAt: new Date(Date.now() - 10 * 60 * 1000) }));

      await expect(
        service.confirmReset('user-1', { confirmationToken: 'wrong-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when confirmation delay has not elapsed', async () => {
      const recentReset = pendingReset({ createdAt: new Date(Date.now() - 30_000) }); // only 30s ago
      resetRepo.findOne.mockResolvedValue(recentReset);

      await expect(
        service.confirmReset('user-1', { confirmationToken: 'abc123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when no pending reset exists', async () => {
      resetRepo.findOne.mockResolvedValue(null);

      await expect(
        service.confirmReset('user-1', { confirmationToken: 'abc123' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── cancelReset ────────────────────────────────────────────────────────

  describe('cancelReset', () => {
    it('cancels a pending reset', async () => {
      const reset = pendingReset();
      resetRepo.findOne.mockResolvedValue(reset);
      resetRepo.save.mockImplementation((d) => Promise.resolve({ ...d, status: ResetStatus.CANCELLED }));
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.cancelReset('user-1');
      expect(result.status).toBe(ResetStatus.CANCELLED);
    });

    it('throws when there is no pending reset', async () => {
      resetRepo.findOne.mockResolvedValue(null);
      await expect(service.cancelReset('user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getLastBackup ───────────────────────────────────────────────────────

  describe('getLastBackup', () => {
    it('returns the backup snapshot of the last completed reset', async () => {
      const snapshot = { userId: 'user-1', capturedAt: '2025-01-01T00:00:00Z' };
      resetRepo.findOne.mockResolvedValue({ backupSnapshot: snapshot });

      const result = await service.getLastBackup('user-1');
      expect(result).toEqual(snapshot);
    });

    it('returns null when no completed reset exists', async () => {
      resetRepo.findOne.mockResolvedValue(null);
      const result = await service.getLastBackup('user-1');
      expect(result).toBeNull();
    });
  });

  // ─── linkAccount ─────────────────────────────────────────────────────────

  describe('linkAccount', () => {
    it('links a new provider account', async () => {
      const user = { ...baseUser(), linkedAccounts: {} };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((d) => Promise.resolve(d));
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.linkAccount('user-1', {
        provider: 'google',
        externalId: 'google-uid-123',
      });

      expect((result as any).linkedAccounts['google']).toBe('google-uid-123');
    });

    it('throws when provider is already linked', async () => {
      const user = { ...baseUser(), linkedAccounts: { google: 'existing-uid' } };
      userRepo.findOne.mockResolvedValue(user);

      await expect(
        service.linkAccount('user-1', { provider: 'google', externalId: 'new-uid' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── unlinkAccount ───────────────────────────────────────────────────────

  describe('unlinkAccount', () => {
    it('removes a linked provider', async () => {
      const user = { ...baseUser(), linkedAccounts: { discord: 'discord-uid' } };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockImplementation((d) => Promise.resolve(d));
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.unlinkAccount('user-1', 'discord');
      expect((result as any).linkedAccounts?.discord).toBeUndefined();
    });

    it('throws when provider not linked', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser(), linkedAccounts: {} });

      await expect(
        service.unlinkAccount('user-1', 'twitter'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getAuditTrail ───────────────────────────────────────────────────────

  describe('getAuditTrail', () => {
    it('returns audit events for a user', async () => {
      const events = [
        { id: 'e1', userId: 'user-1', action: AccountAuditAction.RESET_REQUESTED, createdAt: new Date() },
        { id: 'e2', userId: 'user-1', action: AccountAuditAction.RESET_COMPLETED, createdAt: new Date() },
      ];
      auditRepo.find.mockResolvedValue(events);

      const result = await service.getAuditTrail('user-1');
      expect(result).toHaveLength(2);
      expect(result[0].action).toBe(AccountAuditAction.RESET_REQUESTED);
    });
  });
});
