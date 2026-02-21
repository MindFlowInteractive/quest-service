import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrivacySettings } from '../entities/privacy-settings.entity';
import { DataAccessAudit } from '../entities/data-access-audit.entity';
import { ConsentLog } from '../entities/consent-log.entity';
import { DataExportRequest } from '../entities/data-export-request.entity';
import { DataDeletionRequest } from '../entities/data-deletion-request.entity';
import { DataRetentionPolicy } from '../interfaces';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  // Default retention policies (in days)
  private readonly defaultPolicies: DataRetentionPolicy[] = [
    { entityType: 'user', retentionDays: 2555, deleteAfterDays: 2555 }, // 7 years
    { entityType: 'game_session', retentionDays: 365, anonymizeAfterDays: 730 },
    { entityType: 'audit_log', retentionDays: 2555 }, // 7 years for compliance
    { entityType: 'consent_log', retentionDays: 2555 }, // 7 years for compliance
    { entityType: 'export_request', retentionDays: 30, deleteAfterDays: 90 },
    { entityType: 'deletion_request', retentionDays: 2555 }, // Keep forever for compliance
  ];

  constructor(
    @InjectRepository(PrivacySettings)
    private privacySettingsRepository: Repository<PrivacySettings>,
    @InjectRepository(DataAccessAudit)
    private auditRepository: Repository<DataAccessAudit>,
    @InjectRepository(ConsentLog)
    private consentLogRepository: Repository<ConsentLog>,
    @InjectRepository(DataExportRequest)
    private exportRequestRepository: Repository<DataExportRequest>,
    @InjectRepository(DataDeletionRequest)
    private deletionRequestRepository: Repository<DataDeletionRequest>,
  ) {}

  /**
   * Cron job: Enforce data retention policies
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async enforceRetentionPolicies(): Promise<void> {
    this.logger.log('Enforcing data retention policies...');

    for (const policy of this.defaultPolicies) {
      try {
        await this.applyRetentionPolicy(policy);
      } catch (error) {
        this.logger.error(`Error applying retention policy for ${policy.entityType}:`, error);
      }
    }

    // Process auto-delete settings for users
    await this.processAutoDeleteSettings();
  }

  /**
   * Apply retention policy to an entity type
   */
  private async applyRetentionPolicy(policy: DataRetentionPolicy): Promise<void> {
    const now = new Date();

    // Handle anonymization
    if (policy.anonymizeAfterDays) {
      const anonymizeBefore = new Date(now);
      anonymizeBefore.setDate(anonymizeBefore.getDate() - policy.anonymizeAfterDays);

      await this.anonymizeOldData(policy.entityType, anonymizeBefore);
    }

    // Handle deletion
    if (policy.deleteAfterDays) {
      const deleteBefore = new Date(now);
      deleteBefore.setDate(deleteBefore.getDate() - policy.deleteAfterDays);

      await this.deleteOldData(policy.entityType, deleteBefore);
    }
  }

  /**
   * Anonymize old data
   */
  private async anonymizeOldData(entityType: string, beforeDate: Date): Promise<number> {
    this.logger.log(`Anonymizing ${entityType} data before ${beforeDate.toISOString()}`);

    let count = 0;

    switch (entityType) {
      case 'game_session':
        // TODO: Implement game session anonymization
        break;
      // Add other entity types as needed
    }

    return count;
  }

  /**
   * Delete old data
   */
  private async deleteOldData(entityType: string, beforeDate: Date): Promise<number> {
    this.logger.log(`Deleting ${entityType} data before ${beforeDate.toISOString()}`);

    let count = 0;

    switch (entityType) {
      case 'export_request':
        const oldExports = await this.exportRequestRepository.find({
          where: {
            createdAt: LessThan(beforeDate),
          },
        });
        
        for (const exportRequest of oldExports) {
          await this.exportRequestRepository.delete(exportRequest.id);
          count++;
        }
        break;

      // Add other entity types as needed
    }

    return count;
  }

  /**
   * Process auto-delete settings for users
   */
  private async processAutoDeleteSettings(): Promise<void> {
    const usersWithAutoDelete = await this.privacySettingsRepository.find({
      where: { autoDeleteEnabled: true },
    });

    for (const settings of usersWithAutoDelete) {
      if (!settings.autoDeleteAfterDays) continue;

      const deleteBefore = new Date();
      deleteBefore.setDate(deleteBefore.getDate() - settings.autoDeleteAfterDays);

      // Check if user has been inactive
      // TODO: Implement inactive user detection and deletion
      this.logger.log(`Checking auto-delete for user ${settings.userId}`);
    }
  }

  /**
   * Get retention policy for an entity type
   */
  getRetentionPolicy(entityType: string): DataRetentionPolicy | undefined {
    return this.defaultPolicies.find(p => p.entityType === entityType);
  }

  /**
   * Update retention policy (admin only)
   */
  updateRetentionPolicy(policy: DataRetentionPolicy): void {
    const index = this.defaultPolicies.findIndex(p => p.entityType === policy.entityType);
    if (index >= 0) {
      this.defaultPolicies[index] = policy;
    } else {
      this.defaultPolicies.push(policy);
    }
  }

  /**
   * Get all retention policies
   */
  getAllRetentionPolicies(): DataRetentionPolicy[] {
    return [...this.defaultPolicies];
  }

  /**
   * Clean up old audit logs
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldAuditLogs(): Promise<void> {
    const retentionDays = 2555; // 7 years
    const deleteBefore = new Date();
    deleteBefore.setDate(deleteBefore.getDate() - retentionDays);

    const result = await this.auditRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :date', { date: deleteBefore })
      .andWhere('accessReason != :reason', { reason: 'legal_request' })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old audit logs`);
  }

  /**
   * Get data retention summary for a user
   */
  async getUserDataRetentionSummary(userId: string): Promise<{
    settings: PrivacySettings;
    oldestDataDate: Date | null;
    dataScheduledForDeletion: boolean;
    autoDeleteDate: Date | null;
  }> {
    const settings = await this.privacySettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      throw new Error('Privacy settings not found');
    }

    // Calculate auto-delete date if enabled
    let autoDeleteDate: Date | null = null;
    if (settings.autoDeleteEnabled && settings.autoDeleteAfterDays) {
      // TODO: Get user's last activity date and calculate
      autoDeleteDate = new Date();
      autoDeleteDate.setDate(autoDeleteDate.getDate() + settings.autoDeleteAfterDays);
    }

    return {
      settings,
      oldestDataDate: null, // TODO: Calculate from actual data
      dataScheduledForDeletion: false,
      autoDeleteDate,
    };
  }
}
