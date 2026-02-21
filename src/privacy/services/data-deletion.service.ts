import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import {
  DataDeletionRequest,
  DeletionStatus,
  DeletionType,
} from '../entities/data-deletion-request.entity';
import { PrivacySettings } from '../entities/privacy-settings.entity';
import { DataAccessAudit, DataAccessType, DataAccessEntity, AccessReason } from '../entities/data-access-audit.entity';
import { DataDeletionRequestDto, ConfirmDeletionDto } from '../dto/data-deletion-request.dto';
import { AnonymizationResult } from '../interfaces';

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

  /**
   * Request account deletion
   */
  async requestDeletion(
    userId: string,
    dto: DataDeletionRequestDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<DataDeletionRequest> {
    // Check for existing pending deletion
    const existing = await this.deletionRequestRepository.findOne({
      where: { userId, status: LessThan(DeletionStatus.COMPLETED) },
    });

    if (existing) {
      throw new Error('You already have a pending deletion request.');
    }

    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const cooldownHours = 24; // GDPR cooling-off period
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + cooldownHours);

    const deletionRequest = this.deletionRequestRepository.create({
      userId,
      deletionType: dto.deletionType || DeletionType.FULL_ACCOUNT,
      reason: dto.reason,
      reasonDetails: dto.reasonDetails,
      entitiesToDelete: dto.entitiesToDelete,
      confirmationToken,
      cooldownPeriodHours: cooldownHours,
      scheduledFor,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      status: DeletionStatus.CONFIRMATION_REQUIRED,
    });

    const saved = await this.deletionRequestRepository.save(deletionRequest);

    // Log the request
    await this.logDataAccess({
      userId,
      accessedBy: userId,
      accessType: DataAccessType.DELETE,
      entityType: DataAccessEntity.USER,
      accessReason: AccessReason.DATA_DELETION,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    // Send confirmation email (placeholder)
    this.sendConfirmationEmail(userId, confirmationToken);

    return saved;
  }

  /**
   * Confirm deletion request
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

    if (deletionRequest.status !== DeletionStatus.CONFIRMATION_REQUIRED) {
      throw new Error('Deletion request is not awaiting confirmation');
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
   * Cancel deletion request
   */
  async cancelDeletion(
    userId: string,
    reason?: string,
  ): Promise<DataDeletionRequest> {
    const deletionRequest = await this.deletionRequestRepository.findOne({
      where: {
        userId,
        status: LessThan(DeletionStatus.PROCESSING),
      },
    });

    if (!deletionRequest) {
      throw new NotFoundException('No pending deletion request found');
    }

    deletionRequest.status = DeletionStatus.CANCELLED;
    deletionRequest.cancelledAt = new Date();
    deletionRequest.cancelledBy = userId;
    deletionRequest.cancellationReason = reason;

    const saved = await this.deletionRequestRepository.save(deletionRequest);

    this.eventEmitter.emit('privacy.deletion_cancelled', {
      userId,
      deletionId: saved.id,
      timestamp: new Date(),
    });

    return saved;
  }

  /**
   * Process deletion requests (cron job)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledDeletions(): Promise<void> {
    this.logger.log('Processing scheduled deletions...');

    const pendingDeletions = await this.deletionRequestRepository.find({
      where: {
        status: DeletionStatus.PENDING,
        scheduledFor: LessThan(new Date()),
      },
    });

    for (const request of pendingDeletions) {
      await this.executeDeletion(request);
    }
  }

  /**
   * Execute deletion
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

      // Update privacy settings
      await this.privacySettingsRepository.update(
        { userId: request.userId },
        {
          deletionRequestedAt: request.createdAt,
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
      this.logger.error(`Error executing deletion for user ${request.userId}:`, error);

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
   * Anonymize user data
   */
  private async anonymizeUserData(
    userId: string,
    entitiesToDelete?: string[],
  ): Promise<AnonymizationResult> {
    const anonymizedUserId = `anon_${crypto.randomBytes(16).toString('hex')}`;
    const entitiesProcessed: string[] = [];
    let recordsDeleted = 0;
    let recordsAnonymized = 0;

    // Define entities and their anonymization strategy
    const entities = [
      { name: 'user', delete: true },
      { name: 'profile', delete: false, anonymize: true },
      { name: 'game_sessions', delete: false, anonymize: true },
      { name: 'achievements', delete: false, anonymize: false }, // Keep for analytics
      { name: 'transactions', delete: false, anonymize: true },
      { name: 'messages', delete: true },
      { name: 'friends', delete: true },
      { name: 'settings', delete: true },
    ];

    for (const entity of entities) {
      if (entitiesToDelete && !entitiesToDelete.includes(entity.name)) {
        continue;
      }

      try {
        if (entity.delete) {
          // Delete records
          recordsDeleted += await this.deleteEntityData(userId, entity.name);
        } else if (entity.anonymize) {
          // Anonymize records
          recordsAnonymized += await this.anonymizeEntityData(userId, entity.name, anonymizedUserId);
        }
        entitiesProcessed.push(entity.name);
      } catch (error) {
        this.logger.error(`Error processing entity ${entity.name}:`, error);
      }
    }

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
   * Delete entity data
   */
  private async deleteEntityData(userId: string, entityName: string): Promise<number> {
    // TODO: Implement actual deletion logic for each entity
    // This would call respective services/repositories
    this.logger.log(`Deleting ${entityName} data for user ${userId}`);
    return 0;
  }

  /**
   * Anonymize entity data
   */
  private async anonymizeEntityData(
    userId: string,
    entityName: string,
    anonymizedUserId: string,
  ): Promise<number> {
    // TODO: Implement actual anonymization logic
    // Replace PII with anonymized values while preserving analytics data
    this.logger.log(`Anonymizing ${entityName} data for user ${userId}`);
    return 0;
  }

  /**
   * Get deletion status
   */
  async getDeletionStatus(userId: string): Promise<DataDeletionRequest | null> {
    return this.deletionRequestRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Send confirmation email (placeholder)
   */
  private sendConfirmationEmail(userId: string, token: string): void {
    // TODO: Integrate with email service
    this.logger.log(`Confirmation email would be sent to user ${userId} with token ${token}`);
  }

  /**
   * Log data access
   */
  private async logDataAccess(data: {
    userId: string;
    accessedBy: string;
    accessType: DataAccessType;
    entityType: DataAccessEntity;
    accessReason: AccessReason;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const audit = this.auditRepository.create(data);
    await this.auditRepository.save(audit);
  }
}

