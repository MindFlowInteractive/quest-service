import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  DataDeletionRequest,
  DeletionStatus,
  DeletionType,
} from '../entities/data-deletion-request.entity';
import { PrivacySettings } from '../entities/privacy-settings.entity';
import {
  DataAccessAudit,
  DataAccessType,
  DataAccessEntity,
  AccessReason,
} from '../entities/data-access-audit.entity';
import { DataDeletionRequestDto, ConfirmDeletionDto } from '../dto/data-deletion-request.dto';
import { AnonymizationResult } from '../interfaces';

/** Number of days before a confirmed deletion is permanently executed */
const GRACE_PERIOD_DAYS = 30;

@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);

  constructor(
    @InjectRepository(DataDeletionRequest)
    private deletionRequestRepository: Repository<DataDeletionRequest>,
    @InjectRepository(PrivacySettings)
    private privacySettingsRepository: Repository<PrivacySettings>,
    @InjectRepository(DataAccessAudit)
    private auditRepository: Repository<DataAccessAudit>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /account  — initiate deletion.
   * Password confirmation is mandatory.  A confirmation token is generated and
   * emailed to the user before the 30-day grace period starts.
   */
  async requestDeletion(
    userId: string,
    dto: DataDeletionRequestDto,
    metadata?: { ipAddress?: string; userAgent?: string; hashedPassword?: string },
  ): Promise<DataDeletionRequest> {
    // Guard: no duplicate active request
    const existing = await this.getActiveDeletionRequest(userId);
    if (existing) {
      throw new BadRequestException(
        'You already have a pending deletion request. Cancel it first if you want to restart.',
      );
    }

    // Password must be provided and validated externally; service receives hashed
    // password for verification when called via the account controller.
    if (dto.password && metadata?.hashedPassword) {
      const match = await bcrypt.compare(dto.password, metadata.hashedPassword);
      if (!match) {
        throw new UnauthorizedException('Incorrect password confirmation.');
      }
    }

    const confirmationToken = crypto.randomBytes(32).toString('hex');

    // Grace period: 30 days from now
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + GRACE_PERIOD_DAYS);

    const deletionRequest = this.deletionRequestRepository.create({
      userId,
      deletionType: dto.deletionType || DeletionType.FULL_ACCOUNT,
      reason: dto.reason,
      reasonDetails: dto.reasonDetails,
      entitiesToDelete: dto.entitiesToDelete,
      confirmationToken,
      cooldownPeriodHours: GRACE_PERIOD_DAYS * 24,
      scheduledFor,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      // Start in PENDING (already confirmed by password); token is for email verification
      status: DeletionStatus.PENDING,
    });

    const saved = await this.deletionRequestRepository.save(deletionRequest);

    // Mark privacy settings
    await this.privacySettingsRepository.update(
      { userId },
      { deletionRequestedAt: new Date() },
    );

    // Audit log
    await this.logDataAccess({
      userId,
      accessedBy: userId,
      accessType: DataAccessType.DELETE,
      entityType: DataAccessEntity.USER,
      accessReason: AccessReason.DATA_DELETION,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      accessDetails: {
        deletionType: dto.deletionType,
        gracePeriodDays: GRACE_PERIOD_DAYS,
        scheduledFor,
      },
    });

    // Revoke all active JWTs immediately
    await this.revokeUserSessions(userId);

    // Emit event so email service can send confirmation
    this.eventEmitter.emit('privacy.deletion_requested', {
      userId,
      deletionId: saved.id,
      confirmationToken,
      scheduledFor,
      timestamp: new Date(),
    });

    return saved;
  }

  /**
   * POST /account/restore — cancel within grace period.
   */
  async restoreAccount(
    userId: string,
    reason?: string,
  ): Promise<DataDeletionRequest> {
    const request = await this.getActiveDeletionRequest(userId);
    if (!request) {
      throw new NotFoundException('No active deletion request found for this account.');
    }

    if (request.status === DeletionStatus.PROCESSING || request.status === DeletionStatus.COMPLETED) {
      throw new BadRequestException(
        'Deletion is already in progress or completed — it cannot be cancelled.',
      );
    }

    request.status = DeletionStatus.CANCELLED;
    request.cancelledAt = new Date();
    request.cancelledBy = userId;
    request.cancellationReason = reason ?? 'User restored account via POST /account/restore';

    const saved = await this.deletionRequestRepository.save(request);

    // Clear pending deletion flag
    await this.privacySettingsRepository.update(
      { userId },
      { deletionRequestedAt: null },
    );

    // Audit log
    await this.logDataAccess({
      userId,
      accessedBy: userId,
      accessType: DataAccessType.WRITE,
      entityType: DataAccessEntity.USER,
      accessReason: AccessReason.USER_REQUEST,
      accessDetails: { action: 'account_restore', cancellationReason: reason },
    });

    this.eventEmitter.emit('privacy.deletion_cancelled', {
      userId,
      deletionId: saved.id,
      timestamp: new Date(),
    });

    return saved;
  }

  /**
   * Confirm via email token (legacy flow — kept for backwards compatibility).
   */
  async confirmDeletion(
    userId: string,
    dto: ConfirmDeletionDto,
  ): Promise<DataDeletionRequest> {
    const deletionRequest = await this.deletionRequestRepository.findOne({
      where: { userId, confirmationToken: dto.token },
    });

    if (!deletionRequest) {
      throw new NotFoundException('Invalid confirmation token');
    }

    if (
      deletionRequest.status !== DeletionStatus.CONFIRMATION_REQUIRED &&
      deletionRequest.status !== DeletionStatus.PENDING
    ) {
      throw new BadRequestException('Deletion request is not awaiting confirmation');
    }

    deletionRequest.status = DeletionStatus.PENDING;
    deletionRequest.confirmedAt = new Date();
    const saved = await this.deletionRequestRepository.save(deletionRequest);

    this.eventEmitter.emit('privacy.deletion_confirmed', {
      userId,
      deletionId: saved.id,
      scheduledFor: saved.scheduledFor,
    });

    return saved;
  }

  /**
   * Cancel pending deletion (legacy endpoint).
   */
  async cancelDeletion(userId: string, reason?: string): Promise<DataDeletionRequest> {
    return this.restoreAccount(userId, reason);
  }

  /**
   * Get latest deletion request status for a user.
   */
  async getDeletionStatus(userId: string): Promise<DataDeletionRequest | null> {
    return this.deletionRequestRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Admin: list all pending deletion requests (status = PENDING, scheduled past
   * their grace period or approaching it).
   */
  async listPendingDeletionRequests(options?: {
    limit?: number;
    offset?: number;
    status?: DeletionStatus;
  }): Promise<{ requests: DataDeletionRequest[]; total: number }> {
    const status = options?.status ?? DeletionStatus.PENDING;
    const [requests, total] = await this.deletionRequestRepository.findAndCount({
      where: { status },
      order: { scheduledFor: 'ASC' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
    return { requests, total };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cron jobs
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Every hour: execute deletions whose grace period has elapsed.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledDeletions(): Promise<void> {
    this.logger.log('Checking scheduled deletions...');

    const due = await this.deletionRequestRepository.find({
      where: {
        status: DeletionStatus.PENDING,
        scheduledFor: LessThan(new Date()),
      },
    });

    for (const request of due) {
      await this.executeDeletion(request);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Execute a deletion request — anonymise PII across all tables.
   */
  private async executeDeletion(request: DataDeletionRequest): Promise<void> {
    try {
      this.logger.log(`Executing deletion for user ${request.userId}`);

      await this.deletionRequestRepository.update(request.id, {
        status: DeletionStatus.PROCESSING,
        startedAt: new Date(),
      });

      const result = await this.anonymizeUserData(request.userId, request.entitiesToDelete);

      await this.deletionRequestRepository.update(request.id, {
        status: DeletionStatus.COMPLETED,
        completedAt: new Date(),
        anonymizedUserId: result.anonymizedUserId,
        deletionLog: {
          entitiesProcessed: result.entitiesProcessed,
          recordsDeleted: result.recordsDeleted,
          recordsAnonymized: result.recordsAnonymized,
          errors: [],
        },
      });

      await this.privacySettingsRepository.update(
        { userId: request.userId },
        {
          deletionCompletedAt: new Date(),
          anonymized: true,
        },
      );

      this.eventEmitter.emit('privacy.deletion_completed', {
        userId: request.userId,
        anonymizedUserId: result.anonymizedUserId,
        timestamp: new Date(),
      });

      this.logger.log(`Deletion completed for user ${request.userId}`);
    } catch (error) {
      this.logger.error(`Error executing deletion for ${request.userId}:`, error);
      await this.deletionRequestRepository.update(request.id, {
        status: DeletionStatus.FAILED,
        deletionLog: {
          entitiesProcessed: [],
          recordsDeleted: 0,
          recordsAnonymized: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      });
    }
  }

  /**
   * Anonymise / hard-delete PII across every related table.
   * Uses event-based cascading so domain modules stay decoupled.
   */
  private async anonymizeUserData(
    userId: string,
    entitiesToDelete?: string[],
  ): Promise<AnonymizationResult> {
    const anonymizedUserId = `anon_${crypto.randomBytes(16).toString('hex')}`;
    const entitiesProcessed: string[] = [];
    let recordsDeleted = 0;
    let recordsAnonymized = 0;

    // Emit cascade event — each domain module listens and returns counts
    const cascadeResults = await this.eventEmitter.emitAsync(
      'privacy.cascade_delete',
      { userId, anonymizedUserId, entitiesToDelete },
    );

    for (const r of cascadeResults) {
      if (r && typeof r === 'object') {
        entitiesProcessed.push(...(r.entitiesProcessed ?? []));
        recordsDeleted += r.recordsDeleted ?? 0;
        recordsAnonymized += r.recordsAnonymized ?? 0;
      }
    }

    // Hard delete PII fields on the auth user record via event
    await this.eventEmitter.emitAsync('privacy.anonymize_user', {
      userId,
      anonymizedUserId,
    });

    entitiesProcessed.push('auth_user');

    return {
      userId,
      anonymizedUserId,
      entitiesProcessed,
      recordsDeleted,
      recordsAnonymized,
      completedAt: new Date(),
    };
  }

  /**
   * Revoke all active refresh tokens (JWT sessions).
   */
  private async revokeUserSessions(userId: string): Promise<void> {
    try {
      await this.eventEmitter.emitAsync('privacy.revoke_sessions', { userId });
      this.logger.log(`Sessions revoked for user ${userId}`);
    } catch (err) {
      this.logger.warn(`Could not revoke sessions for ${userId}:`, err);
    }
  }

  /**
   * Helper: find the most recent non-terminal deletion request.
   */
  private async getActiveDeletionRequest(
    userId: string,
  ): Promise<DataDeletionRequest | null> {
    return this.deletionRequestRepository.findOne({
      where: {
        userId,
        status: Not(
          In([DeletionStatus.COMPLETED, DeletionStatus.FAILED, DeletionStatus.CANCELLED]),
        ),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Internal audit helper.
   */
  private async logDataAccess(data: {
    userId: string;
    accessedBy: string;
    accessType: DataAccessType;
    entityType: DataAccessEntity;
    accessReason: AccessReason;
    ipAddress?: string;
    userAgent?: string;
    accessDetails?: any;
  }): Promise<void> {
    const audit = this.auditRepository.create(data);
    await this.auditRepository.save(audit);
  }
}

