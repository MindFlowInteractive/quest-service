import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacySettings } from './entities/privacy-settings.entity';
import { ConsentLog, ConsentAction, ConsentType } from './entities/consent-log.entity';
import { DataAccessAudit } from './entities/data-access-audit.entity';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    @InjectRepository(PrivacySettings)
    private privacySettingsRepository: Repository<PrivacySettings>,
    @InjectRepository(ConsentLog)
    private consentLogRepository: Repository<ConsentLog>,
    @InjectRepository(DataAccessAudit)
    private auditRepository: Repository<DataAccessAudit>,
    @InjectRepository(DataExportRequest)
    private exportRequestRepository: Repository<DataExportRequest>,
    @InjectRepository(DataDeletionRequest)
    private deletionRequestRepository: Repository<DataDeletionRequest>,
  ) {}

  /**
   * Initialize privacy for a new user
   */
  async initializeUserPrivacy(userId: string): Promise<void> {
    this.logger.log(`Initializing privacy for user ${userId}`);

    // Create default privacy settings
    const settings = this.privacySettingsRepository.create({
      userId,
      marketingConsent: false,
      analyticsConsent: true,
      personalizationConsent: true,
      thirdPartySharingConsent: false,
      blockchainConsent: true,
      dataRetentionDays: 365,
      profilePublic: false,
      showOnLeaderboard: true,
      allowFriendRequests: true,
    });

    await this.privacySettingsRepository.save(settings);

    // Log initial consents
    await this.logInitialConsents(userId);
  }

  /**
   * Log initial consents
   */
  private async logInitialConsents(userId: string): Promise<void> {
    const consents = [
      { type: 'analytics', granted: true },
      { type: 'personalization', granted: true },
      { type: 'blockchain', granted: true },
      { type: 'marketing', granted: false },
      { type: 'third_party_sharing', granted: false },
    ];

    for (const consent of consents) {
      const log = this.consentLogRepository.create({
        userId,
        consentType: consent.type as ConsentType,
        action: consent.granted ? ConsentAction.GRANTED : ConsentAction.DENIED,
        version: '1.0.0',
        metadata: { source: 'registration' },
      });
      await this.consentLogRepository.save(log);
    }
  }

  /**
   * Check if user data can be processed for a purpose
   */
  async canProcessData(userId: string, purpose: string): Promise<boolean> {
    const settings = await this.privacySettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      return false;
    }

    // Check if account is being deleted
    if (settings.deletionRequestedAt && !settings.deletionCompletedAt) {
      return false;
    }

    // Check specific consent
    switch (purpose) {
      case 'marketing':
        return settings.marketingConsent;
      case 'analytics':
        return settings.analyticsConsent;
      case 'personalization':
        return settings.personalizationConsent;
      case 'third_party_sharing':
        return settings.thirdPartySharingConsent;
      case 'blockchain':
        return settings.blockchainConsent;
      default:
        return true;
    }
  }

  /**
   * Get privacy compliance status for a user
   */
  async getComplianceStatus(userId: string): Promise<{
    compliant: boolean;
    issues: string[];
    lastConsentUpdate: Date | null;
  }> {
    const issues: string[] = [];
    
    const settings = await this.privacySettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      issues.push('Privacy settings not found');
      return { compliant: false, issues, lastConsentUpdate: null };
    }

    // Check for required consents
    if (settings.analyticsConsent && !settings.analyticsConsentDate) {
      issues.push('Analytics consent missing timestamp');
    }

    // Check for outdated consents (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (settings.marketingConsentDate && settings.marketingConsentDate < oneYearAgo) {
      issues.push('Marketing consent may need renewal');
    }

    const lastConsentUpdate = await this.getLastConsentUpdate(userId);

    return {
      compliant: issues.length === 0,
      issues,
      lastConsentUpdate,
    };
  }

  /**
   * Get last consent update date
   */
  private async getLastConsentUpdate(userId: string): Promise<Date | null> {
    const lastConsent = await this.consentLogRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return lastConsent?.createdAt || null;
  }

  /**
   * Get privacy statistics (admin)
   */
  async getPrivacyStatistics(): Promise<{
    totalUsers: number;
    marketingOptIn: number;
    analyticsOptIn: number;
    personalizationOptIn: number;
    thirdPartySharingOptIn: number;
    blockchainOptIn: number;
    deletionRequests: number;
    completedDeletions: number;
  }> {
    const allSettings = await this.privacySettingsRepository.find();

    return {
      totalUsers: allSettings.length,
      marketingOptIn: allSettings.filter(s => s.marketingConsent).length,
      analyticsOptIn: allSettings.filter(s => s.analyticsConsent).length,
      personalizationOptIn: allSettings.filter(s => s.personalizationConsent).length,
      thirdPartySharingOptIn: allSettings.filter(s => s.thirdPartySharingConsent).length,
      blockchainOptIn: allSettings.filter(s => s.blockchainConsent).length,
      deletionRequests: allSettings.filter(s => s.deletionRequestedAt).length,
      completedDeletions: allSettings.filter(s => s.deletionCompletedAt).length,
    };
  }
}
