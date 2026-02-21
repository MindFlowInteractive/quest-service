import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PrivacySettings,
  DataProcessingPurpose,
} from '../entities/privacy-settings.entity';
import { ConsentLog, ConsentType, ConsentAction } from '../entities/consent-log.entity';
import { UpdatePrivacySettingsDto } from '../dto/update-privacy-settings.dto';
import { ConsentUpdateDto } from '../dto/consent-update.dto';

@Injectable()
export class PrivacySettingsService {
  private readonly logger = new Logger(PrivacySettingsService.name);
  private readonly consentVersion = '1.0.0';

  constructor(
    @InjectRepository(PrivacySettings)
    private privacySettingsRepository: Repository<PrivacySettings>,
    @InjectRepository(ConsentLog)
    private consentLogRepository: Repository<ConsentLog>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get or create privacy settings for a user
   */
  async getSettings(userId: string): Promise<PrivacySettings> {
    let settings = await this.privacySettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.privacySettingsRepository.create({
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
    }

    return settings;
  }

  /**
   * Update privacy settings
   */
  async updateSettings(
    userId: string,
    dto: UpdatePrivacySettingsDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<PrivacySettings> {
    const settings = await this.getSettings(userId);

    // Track consent changes
    await this.trackConsentChanges(settings, dto, userId, metadata);

    // Update settings
    Object.assign(settings, dto);
    
    // Update consent dates if consent fields changed
    if (dto.marketingConsent !== undefined) {
      settings.marketingConsentDate = dto.marketingConsent ? new Date() : null;
    }
    if (dto.analyticsConsent !== undefined) {
      settings.analyticsConsentDate = dto.analyticsConsent ? new Date() : null;
    }
    if (dto.personalizationConsent !== undefined) {
      settings.personalizationConsentDate = dto.personalizationConsent ? new Date() : null;
    }
    if (dto.thirdPartySharingConsent !== undefined) {
      settings.thirdPartySharingDate = dto.thirdPartySharingConsent ? new Date() : null;
    }
    if (dto.blockchainConsent !== undefined) {
      settings.blockchainConsentDate = dto.blockchainConsent ? new Date() : null;
    }

    const updated = await this.privacySettingsRepository.save(settings);

    this.eventEmitter.emit('privacy.settings_updated', {
      userId,
      changes: dto,
      timestamp: new Date(),
    });

    return updated;
  }

  /**
   * Update specific consent
   */
  async updateConsent(
    userId: string,
    dto: ConsentUpdateDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<PrivacySettings> {
    const settings = await this.getSettings(userId);
    const previousValue = this.getConsentValue(settings, dto.consentType);

    // Update the specific consent
    this.setConsentValue(settings, dto.consentType, dto.granted);

    // Log the consent change
    await this.logConsentChange({
      userId,
      consentType: dto.consentType,
      action: dto.granted ? ConsentAction.GRANTED : ConsentAction.WITHDRAWN,
      version: dto.version || this.consentVersion,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata: {
        previousValue,
        newValue: dto.granted,
        reason: dto.reason,
      },
    });

    return this.privacySettingsRepository.save(settings);
  }

  /**
   * Check if user has consented to a specific purpose
   */
  async hasConsent(userId: string, purpose: DataProcessingPurpose): Promise<boolean> {
    const settings = await this.getSettings(userId);

    switch (purpose) {
      case DataProcessingPurpose.MARKETING:
        return settings.marketingConsent;
      case DataProcessingPurpose.ANALYTICS:
        return settings.analyticsConsent;
      case DataProcessingPurpose.PERSONALIZATION:
        return settings.personalizationConsent;
      case DataProcessingPurpose.THIRD_PARTY_SHARING:
        return settings.thirdPartySharingConsent;
      case DataProcessingPurpose.BLOCKCHAIN:
        return settings.blockchainConsent;
      default:
        return true;
    }
  }

  /**
   * Get consent history for a user
   */
  async getConsentHistory(userId: string): Promise<ConsentLog[]> {
    return this.consentLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Initialize default consents for new user
   */
  async initializeUserConsents(userId: string): Promise<PrivacySettings> {
    const settings = await this.getSettings(userId);

    // Log initial consents
    const consents = [
      { type: ConsentType.ANALYTICS, granted: true },
      { type: ConsentType.PERSONALIZATION, granted: true },
      { type: ConsentType.BLOCKCHAIN, granted: true },
      { type: ConsentType.MARKETING, granted: false },
      { type: ConsentType.THIRD_PARTY_SHARING, granted: false },
    ];

    for (const consent of consents) {
      await this.logConsentChange({
        userId,
        consentType: consent.type,
        action: consent.granted ? ConsentAction.GRANTED : ConsentAction.DENIED,
        version: this.consentVersion,
        metadata: { source: 'initial_setup' },
      });
    }

    return settings;
  }

  /**
   * Track consent changes from settings update
   */
  private async trackConsentChanges(
    settings: PrivacySettings,
    dto: UpdatePrivacySettingsDto,
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const consentMappings = [
      { field: 'marketingConsent', type: ConsentType.MARKETING },
      { field: 'analyticsConsent', type: ConsentType.ANALYTICS },
      { field: 'personalizationConsent', type: ConsentType.PERSONALIZATION },
      { field: 'thirdPartySharingConsent', type: ConsentType.THIRD_PARTY_SHARING },
      { field: 'blockchainConsent', type: ConsentType.BLOCKCHAIN },
    ];

    for (const mapping of consentMappings) {
      const newValue = dto[mapping.field as keyof UpdatePrivacySettingsDto];
      if (newValue !== undefined) {
        const previousValue = settings[mapping.field as keyof PrivacySettings] as boolean;
        
        if (previousValue !== newValue) {
          await this.logConsentChange({
            userId,
            consentType: mapping.type,
            action: newValue ? ConsentAction.GRANTED : ConsentAction.WITHDRAWN,
            version: this.consentVersion,
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
            metadata: { previousValue, newValue },
          });
        }
      }
    }
  }

  /**
   * Log consent change
   */
  private async logConsentChange(data: {
    userId: string;
    consentType: ConsentType;
    action: ConsentAction;
    version: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<void> {
    const log = this.consentLogRepository.create(data);
    await this.consentLogRepository.save(log);

    this.logger.log(`Consent ${data.action} for ${data.consentType} by user ${data.userId}`);
  }

  /**
   * Get consent value from settings
   */
  private getConsentValue(settings: PrivacySettings, type: ConsentType): boolean {
    switch (type) {
      case ConsentType.MARKETING:
        return settings.marketingConsent;
      case ConsentType.ANALYTICS:
        return settings.analyticsConsent;
      case ConsentType.PERSONALIZATION:
        return settings.personalizationConsent;
      case ConsentType.THIRD_PARTY_SHARING:
        return settings.thirdPartySharingConsent;
      case ConsentType.BLOCKCHAIN:
        return settings.blockchainConsent;
      default:
        return false;
    }
  }

  /**
   * Set consent value in settings
   */
  private setConsentValue(settings: PrivacySettings, type: ConsentType, value: boolean): void {
    switch (type) {
      case ConsentType.MARKETING:
        settings.marketingConsent = value;
        settings.marketingConsentDate = value ? new Date() : null;
        break;
      case ConsentType.ANALYTICS:
        settings.analyticsConsent = value;
        settings.analyticsConsentDate = value ? new Date() : null;
        break;
      case ConsentType.PERSONALIZATION:
        settings.personalizationConsent = value;
        settings.personalizationConsentDate = value ? new Date() : null;
        break;
      case ConsentType.THIRD_PARTY_SHARING:
        settings.thirdPartySharingConsent = value;
        settings.thirdPartySharingDate = value ? new Date() : null;
        break;
      case ConsentType.BLOCKCHAIN:
        settings.blockchainConsent = value;
        settings.blockchainConsentDate = value ? new Date() : null;
        break;
    }
  }
}
