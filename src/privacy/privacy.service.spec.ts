import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivacyService } from './privacy.service';
import { PrivacySettings } from './entities/privacy-settings.entity';
import { ConsentLog, ConsentAction, ConsentType } from './entities/consent-log.entity';
import { DataAccessAudit } from './entities/data-access-audit.entity';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';

describe('PrivacyService', () => {
  let service: PrivacyService;
  let privacySettingsRepository: Repository<PrivacySettings>;
  let consentLogRepository: Repository<ConsentLog>;

  const mockPrivacySettingsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockConsentLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuditRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockExportRequestRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDeletionRequestRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        {
          provide: getRepositoryToken(PrivacySettings),
          useValue: mockPrivacySettingsRepository,
        },
        {
          provide: getRepositoryToken(ConsentLog),
          useValue: mockConsentLogRepository,
        },
        {
          provide: getRepositoryToken(DataAccessAudit),
          useValue: mockAuditRepository,
        },
        {
          provide: getRepositoryToken(DataExportRequest),
          useValue: mockExportRequestRepository,
        },
        {
          provide: getRepositoryToken(DataDeletionRequest),
          useValue: mockDeletionRequestRepository,
        },
      ],
    }).compile();

    service = module.get<PrivacyService>(PrivacyService);
    privacySettingsRepository = module.get<Repository<PrivacySettings>>(
      getRepositoryToken(PrivacySettings),
    );
    consentLogRepository = module.get<Repository<ConsentLog>>(
      getRepositoryToken(ConsentLog),
    );

    jest.clearAllMocks();
  });

  describe('initializeUserPrivacy', () => {
    it('should create default privacy settings for new user', async () => {
      const userId = 'user-123';
      const defaultSettings = {
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
      };

      mockPrivacySettingsRepository.create.mockReturnValue(defaultSettings);
      mockPrivacySettingsRepository.save.mockResolvedValue(defaultSettings);
      mockConsentLogRepository.create.mockReturnValue({});
      mockConsentLogRepository.save.mockResolvedValue({});

      await service.initializeUserPrivacy(userId);

      expect(mockPrivacySettingsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          marketingConsent: false,
          analyticsConsent: true,
        }),
      );
      expect(mockPrivacySettingsRepository.save).toHaveBeenCalled();
    });

    it('should log initial consents', async () => {
      const userId = 'user-123';
      mockPrivacySettingsRepository.create.mockReturnValue({});
      mockPrivacySettingsRepository.save.mockResolvedValue({});
      mockConsentLogRepository.create.mockReturnValue({});
      mockConsentLogRepository.save.mockResolvedValue({});

      await service.initializeUserPrivacy(userId);

      expect(mockConsentLogRepository.create).toHaveBeenCalledTimes(5);
      expect(mockConsentLogRepository.save).toHaveBeenCalledTimes(5);
    });
  });

  describe('canProcessData', () => {
    it('should return true when user has consented to analytics', async () => {
      const userId = 'user-123';
      const settings = {
        userId,
        analyticsConsent: true,
        deletionRequestedAt: null,
      };

      mockPrivacySettingsRepository.findOne.mockResolvedValue(settings);

      const result = await service.canProcessData(userId, 'analytics');

      expect(result).toBe(true);
    });

    it('should return false when user has not consented to marketing', async () => {
      const userId = 'user-123';
      const settings = {
        userId,
        marketingConsent: false,
        deletionRequestedAt: null,
      };

      mockPrivacySettingsRepository.findOne.mockResolvedValue(settings);

      const result = await service.canProcessData(userId, 'marketing');

      expect(result).toBe(false);
    });

    it('should return false when account is being deleted', async () => {
      const userId = 'user-123';
      const settings = {
        userId,
        analyticsConsent: true,
        deletionRequestedAt: new Date(),
        deletionCompletedAt: null,
      };

      mockPrivacySettingsRepository.findOne.mockResolvedValue(settings);

      const result = await service.canProcessData(userId, 'analytics');

      expect(result).toBe(false);
    });

    it('should return false when settings not found', async () => {
      const userId = 'user-123';
      mockPrivacySettingsRepository.findOne.mockResolvedValue(null);

      const result = await service.canProcessData(userId, 'analytics');

      expect(result).toBe(false);
    });
  });

  describe('getComplianceStatus', () => {
    it('should return compliant status when no issues', async () => {
      const userId = 'user-123';
      const settings = {
        userId,
        analyticsConsent: true,
        analyticsConsentDate: new Date(),
        marketingConsentDate: new Date(),
      };

      mockPrivacySettingsRepository.findOne.mockResolvedValue(settings);
      mockConsentLogRepository.findOne.mockResolvedValue({ createdAt: new Date() });

      const result = await service.getComplianceStatus(userId);

      expect(result.compliant).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing privacy settings', async () => {
      const userId = 'user-123';
      mockPrivacySettingsRepository.findOne.mockResolvedValue(null);

      const result = await service.getComplianceStatus(userId);

      expect(result.compliant).toBe(false);
      expect(result.issues).toContain('Privacy settings not found');
    });

    it('should detect missing consent timestamp', async () => {
      const userId = 'user-123';
      const settings = {
        userId,
        analyticsConsent: true,
        analyticsConsentDate: null,
      };

      mockPrivacySettingsRepository.findOne.mockResolvedValue(settings);
      mockConsentLogRepository.findOne.mockResolvedValue({ createdAt: new Date() });

      const result = await service.getComplianceStatus(userId);

      expect(result.issues).toContain('Analytics consent missing timestamp');
    });
  });

  describe('getPrivacyStatistics', () => {
    it('should return aggregated privacy statistics', async () => {
      const settings = [
        { marketingConsent: true, analyticsConsent: true, deletionRequestedAt: null },
        { marketingConsent: false, analyticsConsent: true, deletionRequestedAt: new Date() },
        { marketingConsent: false, analyticsConsent: false, deletionCompletedAt: new Date() },
      ];

      mockPrivacySettingsRepository.find.mockResolvedValue(settings);

      const result = await service.getPrivacyStatistics();

      expect(result.totalUsers).toBe(3);
      expect(result.marketingOptIn).toBe(1);
      expect(result.analyticsOptIn).toBe(2);
      expect(result.deletionRequests).toBe(2);
      expect(result.completedDeletions).toBe(1);
    });
  });
});
