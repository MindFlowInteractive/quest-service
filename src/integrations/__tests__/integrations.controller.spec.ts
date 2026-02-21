import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { IntegrationsController } from '../integrations.controller';
import { IntegrationSettings } from '../entities/integration-settings.entity';
import { SocialAccount, SocialProvider } from '../entities/social-account.entity';
import { WebhookEvent, WebhookEventStatus } from '../entities/webhook-event.entity';
import { DiscordService } from '../services/discord.service';
import { TwitterService } from '../services/twitter.service';
import { IntegrationNotificationService } from '../services/integration-notification.service';

describe('IntegrationsController', () => {
    let controller: IntegrationsController;
    let settingsRepo: any;
    let socialAccountRepo: any;
    let webhookEventRepo: any;
    let discordService: any;
    let integrationNotificationService: any;

    const mockReq = { user: { sub: 'user-123', email: 'test@example.com' } };

    beforeEach(async () => {
        settingsRepo = {
            findOne: jest.fn(),
            create: jest.fn((dto) => ({ ...dto })),
            save: jest.fn((entity) => Promise.resolve({ id: 'settings-1', ...entity })),
        };

        socialAccountRepo = {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn((dto) => ({ id: 'acc-1', ...dto })),
            save: jest.fn((entity) => Promise.resolve(entity)),
            remove: jest.fn().mockResolvedValue({}),
        };

        webhookEventRepo = {
            create: jest.fn((dto) => ({ id: 'evt-1', ...dto })),
            save: jest.fn((entity) => Promise.resolve(entity)),
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [IntegrationsController],
            providers: [
                { provide: getRepositoryToken(IntegrationSettings), useValue: settingsRepo },
                { provide: getRepositoryToken(SocialAccount), useValue: socialAccountRepo },
                { provide: getRepositoryToken(WebhookEvent), useValue: webhookEventRepo },
                {
                    provide: DiscordService,
                    useValue: {
                        verifyWebhookSignature: jest.fn().mockReturnValue(true),
                    },
                },
                { provide: TwitterService, useValue: {} },
                {
                    provide: IntegrationNotificationService,
                    useValue: {
                        notifyAchievement: jest.fn().mockResolvedValue({ discord: { success: true } }),
                        notifyLeaderboardRank: jest.fn().mockResolvedValue({}),
                    },
                },
            ],
        }).compile();

        controller = module.get<IntegrationsController>(IntegrationsController);
        discordService = module.get(DiscordService);
        integrationNotificationService = module.get(IntegrationNotificationService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // ── Settings ────────────────────────────────────────────────────

    describe('getSettings', () => {
        it('should return existing settings', async () => {
            const mockSettings = { id: 'settings-1', userId: 'user-123', discordEnabled: true };
            settingsRepo.findOne.mockResolvedValue(mockSettings);

            const result = await controller.getSettings(mockReq);
            expect(result).toEqual(mockSettings);
        });

        it('should create default settings if none exist', async () => {
            settingsRepo.findOne.mockResolvedValue(null);

            const result = await controller.getSettings(mockReq);
            expect(settingsRepo.create).toHaveBeenCalledWith({ userId: 'user-123' });
            expect(settingsRepo.save).toHaveBeenCalled();
        });
    });

    describe('updateSettings', () => {
        it('should update existing settings', async () => {
            settingsRepo.findOne.mockResolvedValue({ id: 'settings-1', userId: 'user-123' });

            const result = await controller.updateSettings(mockReq, {
                discordEnabled: true,
                discordWebhookUrl: 'https://discord.com/test',
            });

            expect(settingsRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ discordEnabled: true }),
            );
        });
    });

    // ── Social Account Linking ──────────────────────────────────────

    describe('getLinkedAccounts', () => {
        it('should return accounts without sensitive tokens', async () => {
            socialAccountRepo.find.mockResolvedValue([
                {
                    id: 'acc-1',
                    provider: SocialProvider.DISCORD,
                    providerUserId: 'discord-123',
                    accessToken: 'secret-token',
                    refreshToken: 'secret-refresh',
                },
            ]);

            const result = await controller.getLinkedAccounts(mockReq);
            expect(result).toHaveLength(1);
            expect(result[0].accessToken).toBeUndefined();
            expect(result[0].refreshToken).toBeUndefined();
            expect(result[0].provider).toBe(SocialProvider.DISCORD);
        });
    });

    describe('linkAccount', () => {
        it('should link a new social account', async () => {
            socialAccountRepo.findOne.mockResolvedValue(null);

            const result = await controller.linkAccount(mockReq, {
                provider: SocialProvider.DISCORD,
                authorizationCode: 'auth-code-123',
            });

            expect(socialAccountRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-123',
                    provider: SocialProvider.DISCORD,
                }),
            );
        });

        it('should throw BadRequestException if account already linked', async () => {
            socialAccountRepo.findOne.mockResolvedValue({ id: 'existing' });

            await expect(
                controller.linkAccount(mockReq, {
                    provider: SocialProvider.DISCORD,
                    authorizationCode: 'code',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('unlinkAccount', () => {
        it('should unlink an existing account', async () => {
            socialAccountRepo.findOne.mockResolvedValue({
                id: 'acc-1',
                provider: SocialProvider.TWITTER,
            });

            const result = await controller.unlinkAccount(mockReq, 'acc-1');
            expect(result.message).toContain('twitter');
            expect(socialAccountRepo.remove).toHaveBeenCalled();
        });

        it('should throw BadRequestException if account not found', async () => {
            socialAccountRepo.findOne.mockResolvedValue(null);

            await expect(
                controller.unlinkAccount(mockReq, 'non-existent'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ── Sharing ─────────────────────────────────────────────────────

    describe('shareAchievement', () => {
        it('should share an achievement through the notification service', async () => {
            const result = await controller.shareAchievement(mockReq, {
                platform: 'all',
                contentType: 'achievement',
                contentId: 'ach-123',
                customMessage: 'I did it!',
            });

            expect(integrationNotificationService.notifyAchievement).toHaveBeenCalledWith(
                'user-123',
                expect.objectContaining({ achievementId: 'ach-123' }),
            );
        });

        it('should reject non-achievement content type', async () => {
            await expect(
                controller.shareAchievement(mockReq, {
                    platform: 'discord',
                    contentType: 'leaderboard',
                    contentId: 'lb-1',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    // ── Webhooks ────────────────────────────────────────────────────

    describe('handleDiscordWebhook', () => {
        it('should respond to Discord ping with type 1', async () => {
            const result = await controller.handleDiscordWebhook({ type: 1 });
            expect(result).toEqual({ type: 1 });
        });

        it('should log and process webhook events', async () => {
            webhookEventRepo.findOne.mockResolvedValue({
                id: 'evt-1',
                status: WebhookEventStatus.RECEIVED,
            });

            const result = await controller.handleDiscordWebhook({
                type: 2,
                data: { name: 'test-command' },
            });

            expect(result.received).toBe(true);
            expect(webhookEventRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ source: 'discord' }),
            );
        });

        it('should reject invalid signatures', async () => {
            discordService.verifyWebhookSignature.mockReturnValue(false);

            await expect(
                controller.handleDiscordWebhook(
                    { type: 2 },
                    'bad-sig',
                    'timestamp',
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('handleExternalWebhook', () => {
        it('should receive and log external webhook events', async () => {
            const result = await controller.handleExternalWebhook({
                source: 'custom-service',
                eventType: 'user.action',
                payload: { key: 'value' },
            });

            expect(result.received).toBe(true);
            expect(webhookEventRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    source: 'custom-service',
                    eventType: 'user.action',
                }),
            );
        });
    });
});
