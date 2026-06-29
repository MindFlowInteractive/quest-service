import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { DataDeletionService } from './data-deletion.service';
import {
  DataDeletionRequest,
  DeletionStatus,
  DeletionType,
  DeletionReason,
} from '../entities/data-deletion-request.entity';
import { PrivacySettings } from '../entities/privacy-settings.entity';
import { DataAccessAudit } from '../entities/data-access-audit.entity';
import { DataDeletionRequestDto } from '../dto/data-deletion-request.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  findAndCount: jest.fn(),
});

const makeEmitter = () => ({
  emit: jest.fn(),
  emitAsync: jest.fn().mockResolvedValue([null]),
});

// ─────────────────────────────────────────────────────────────────────────────
// DataDeletionService
// ─────────────────────────────────────────────────────────────────────────────

describe('DataDeletionService', () => {
  let service: DataDeletionService;
  let deletionRepo: ReturnType<typeof makeRepo>;
  let privacyRepo: ReturnType<typeof makeRepo>;
  let auditRepo: ReturnType<typeof makeRepo>;
  let emitter: ReturnType<typeof makeEmitter>;

  beforeEach(async () => {
    deletionRepo = makeRepo();
    privacyRepo = makeRepo();
    auditRepo = makeRepo();
    emitter = makeEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataDeletionService,
        { provide: getRepositoryToken(DataDeletionRequest), useValue: deletionRepo },
        { provide: getRepositoryToken(PrivacySettings), useValue: privacyRepo },
        { provide: getRepositoryToken(DataAccessAudit), useValue: auditRepo },
        { provide: EventEmitter2, useValue: emitter },
      ],
    }).compile();

    service = module.get<DataDeletionService>(DataDeletionService);
    jest.clearAllMocks();
  });

  // ───────── Deletion request ───────────────────────────────────────────────

  describe('requestDeletion', () => {
    it('should create a deletion request with 30-day grace period', async () => {
      deletionRepo.findOne.mockResolvedValue(null); // no active request
      const expectedScheduled = new Date();
      expectedScheduled.setDate(expectedScheduled.getDate() + 30);

      const saved: Partial<DataDeletionRequest> = {
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.PENDING,
        scheduledFor: expectedScheduled,
        confirmationToken: 'tok',
      };
      deletionRepo.create.mockReturnValue(saved);
      deletionRepo.save.mockResolvedValue(saved);
      privacyRepo.update.mockResolvedValue({});
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const dto: DataDeletionRequestDto = {
        deletionType: DeletionType.FULL_ACCOUNT,
        reason: DeletionReason.USER_REQUEST,
      };

      const result = await service.requestDeletion('user-1', dto);

      expect(result.status).toBe(DeletionStatus.PENDING);
      // Grace period should be ~30 days out
      const diffDays =
        (result.scheduledFor!.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(29);
      expect(diffDays).toBeLessThan(31);
    });

    it('should reject if user already has an active deletion request', async () => {
      deletionRepo.findOne.mockResolvedValue({
        id: 'existing',
        status: DeletionStatus.PENDING,
      });

      await expect(
        service.requestDeletion('user-1', {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject with UnauthorizedException on wrong password', async () => {
      deletionRepo.findOne.mockResolvedValue(null);
      const hashed = await bcrypt.hash('correct-password', 10);

      await expect(
        service.requestDeletion(
          'user-1',
          { password: 'wrong-password' },
          { hashedPassword: hashed },
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should accept correct password and queue deletion', async () => {
      deletionRepo.findOne.mockResolvedValue(null);
      const hashed = await bcrypt.hash('correct-password', 10);

      const saved = {
        id: 'del-2',
        status: DeletionStatus.PENDING,
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        confirmationToken: 'tok2',
      };
      deletionRepo.create.mockReturnValue(saved);
      deletionRepo.save.mockResolvedValue(saved);
      privacyRepo.update.mockResolvedValue({});
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.requestDeletion(
        'user-1',
        { password: 'correct-password' },
        { hashedPassword: hashed },
      );

      expect(result.status).toBe(DeletionStatus.PENDING);
    });

    it('should revoke sessions (emit privacy.revoke_sessions) on deletion request', async () => {
      deletionRepo.findOne.mockResolvedValue(null);
      const saved = { id: 'del-3', status: DeletionStatus.PENDING, scheduledFor: new Date(), confirmationToken: 'tok3' };
      deletionRepo.create.mockReturnValue(saved);
      deletionRepo.save.mockResolvedValue(saved);
      privacyRepo.update.mockResolvedValue({});
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      await service.requestDeletion('user-1', {});

      expect(emitter.emitAsync).toHaveBeenCalledWith(
        'privacy.revoke_sessions',
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('should create an audit log entry', async () => {
      deletionRepo.findOne.mockResolvedValue(null);
      const saved = { id: 'del-audit', status: DeletionStatus.PENDING, scheduledFor: new Date(), confirmationToken: 'tok-a' };
      deletionRepo.create.mockReturnValue(saved);
      deletionRepo.save.mockResolvedValue(saved);
      privacyRepo.update.mockResolvedValue({});
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      await service.requestDeletion('user-1', {});

      expect(auditRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  // ───────── Grace period & restore (cancel) ────────────────────────────────

  describe('restoreAccount (grace period cancellation)', () => {
    it('should cancel a PENDING deletion request', async () => {
      const activeRequest: Partial<DataDeletionRequest> = {
        id: 'del-restore',
        userId: 'user-2',
        status: DeletionStatus.PENDING,
        scheduledFor: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
      };
      // findOne for getActiveDeletionRequest
      deletionRepo.findOne.mockResolvedValue(activeRequest);
      deletionRepo.save.mockResolvedValue({
        ...activeRequest,
        status: DeletionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: 'user-2',
      });
      privacyRepo.update.mockResolvedValue({});
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      const result = await service.restoreAccount('user-2', 'Changed my mind');

      expect(result.status).toBe(DeletionStatus.CANCELLED);
      expect(result.cancelledBy).toBe('user-2');
    });

    it('should throw NotFoundException if no active request found', async () => {
      deletionRepo.findOne.mockResolvedValue(null);

      await expect(service.restoreAccount('user-3')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should reject restore if deletion is already PROCESSING', async () => {
      deletionRepo.findOne.mockResolvedValue({
        id: 'del-processing',
        status: DeletionStatus.PROCESSING,
      });

      await expect(service.restoreAccount('user-4')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject restore if deletion is already COMPLETED', async () => {
      deletionRepo.findOne.mockResolvedValue({
        id: 'del-done',
        status: DeletionStatus.COMPLETED,
      });

      await expect(service.restoreAccount('user-5')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should emit privacy.deletion_cancelled on successful restore', async () => {
      const active = { id: 'del-r', userId: 'u-emit', status: DeletionStatus.PENDING };
      deletionRepo.findOne.mockResolvedValue(active);
      deletionRepo.save.mockResolvedValue({
        ...active,
        status: DeletionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: 'u-emit',
      });
      privacyRepo.update.mockResolvedValue({});
      auditRepo.create.mockReturnValue({});
      auditRepo.save.mockResolvedValue({});

      await service.restoreAccount('u-emit');

      expect(emitter.emit).toHaveBeenCalledWith(
        'privacy.deletion_cancelled',
        expect.objectContaining({ userId: 'u-emit' }),
      );
    });
  });

  // ───────── Cascade deletion ───────────────────────────────────────────────

  describe('processScheduledDeletions (cascade)', () => {
    it('should emit privacy.cascade_delete for each due request', async () => {
      const due = [
        {
          id: 'del-c1',
          userId: 'cascade-user',
          status: DeletionStatus.PENDING,
          entitiesToDelete: null,
        },
      ];
      deletionRepo.find.mockResolvedValue(due);
      deletionRepo.update.mockResolvedValue({});
      privacyRepo.update.mockResolvedValue({});
      emitter.emitAsync.mockResolvedValue([{
        entitiesProcessed: ['user', 'profile', 'sessions'],
        recordsDeleted: 5,
        recordsAnonymized: 3,
      }]);

      await service.processScheduledDeletions();

      expect(emitter.emitAsync).toHaveBeenCalledWith(
        'privacy.cascade_delete',
        expect.objectContaining({ userId: 'cascade-user' }),
      );
    });

    it('should update status to COMPLETED after successful cascade', async () => {
      const due = [
        { id: 'del-complete', userId: 'u-comp', status: DeletionStatus.PENDING, entitiesToDelete: null },
      ];
      deletionRepo.find.mockResolvedValue(due);
      deletionRepo.update.mockResolvedValue({});
      privacyRepo.update.mockResolvedValue({});
      emitter.emitAsync.mockResolvedValue([{
        entitiesProcessed: ['user'],
        recordsDeleted: 1,
        recordsAnonymized: 0,
      }]);

      await service.processScheduledDeletions();

      // Should have been called with COMPLETED status
      expect(deletionRepo.update).toHaveBeenCalledWith(
        'del-complete',
        expect.objectContaining({ status: DeletionStatus.COMPLETED }),
      );
    });

    it('should mark FAILED on cascade error', async () => {
      const due = [
        { id: 'del-fail', userId: 'u-fail', status: DeletionStatus.PENDING, entitiesToDelete: null },
      ];
      deletionRepo.find.mockResolvedValue(due);
      deletionRepo.update.mockResolvedValue({});
      emitter.emitAsync.mockRejectedValueOnce(new Error('DB error'));

      await service.processScheduledDeletions();

      expect(deletionRepo.update).toHaveBeenCalledWith(
        'del-fail',
        expect.objectContaining({ status: DeletionStatus.FAILED }),
      );
    });
  });

  // ───────── Admin: list pending deletions ──────────────────────────────────

  describe('listPendingDeletionRequests', () => {
    it('should return paginated list with total', async () => {
      const requests = [
        { id: 'r1', status: DeletionStatus.PENDING },
        { id: 'r2', status: DeletionStatus.PENDING },
      ];
      deletionRepo.findAndCount.mockResolvedValue([requests, 2]);

      const result = await service.listPendingDeletionRequests({ limit: 10, offset: 0 });

      expect(result.requests).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});

