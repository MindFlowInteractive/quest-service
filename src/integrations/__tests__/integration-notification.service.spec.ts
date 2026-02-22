import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IntegrationNotificationService } from '../services/integration-notification.service';
import { IntegrationSettings } from '../entities/integration-settings.entity';
import { SocialAccount, SocialProvider } from '../entities/social-account.entity';
import { DiscordService } from '../services/discord.service';
import { TwitterService } from '../services/twitter.service';

describe('IntegrationNotificationService', () => {
    let service: IntegrationNotificationService;
    let settingsRepo: any;
    let socialAccountRepo: any;
    let discordService: jest.Mocked<DiscordService>;
    let twitterService: jest.Mocked<TwitterService>;

    beforeEach(async () => {
        settingsRepo = {
            findOne: jest.fn(),
            create: jest.fn((dto) => ({ ...dto })),
            save: jest.fn((entity) => Promise.resolve({ id: 'settings-1', ...entity })),
        };

        socialAccountRepo = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IntegrationNotificationService,
                {
                    provide: getRepositoryToken(IntegrationSettings),
                    useValue: settingsRepo,
                },
                {
                    provide: getRepositoryToken(SocialAccount),
                    useValue: socialAccountRepo,
                },
                {
                    provide: DiscordService,
                    useValue: {
                        postAchievement: jest.fn().mockResolvedValue({ success: true, message: 'Sent' }),
                        postLeaderboardUpdate: jest.fn().mockResolvedValue({ success: true, message: 'Sent' }),
                    },
                },
                {
                    provide: TwitterService,
                    useValue: {
                        shareAchievement: jest.fn().mockReturnValue({ success: true, shareUrl: 'https://twitter.com/intent/tweet?text=test', message: 'Generated' }),
                        shareLeaderboardRank: jest.fn().mockReturnValue({ success: true, shareUrl: 'https://twitter.com/intent/tweet?text=test', message: 'Generated' }),
                        postTweet: jest.fn().mockResolvedValue({ success: true, message: 'Posted' }),
                    },
                },
            ],
        }).compile();

        service = module.get<IntegrationNotificationService>(IntegrationNotificationService);
        discordService = module.get(DiscordService);
        twitterService = module.get(TwitterService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('notifyAchievement', () => {
        const achievement = {
            name: 'First Win',
            description: 'Win your first puzzle',
            achievementId: 'ach-1',
        };

        it('should notify Discord when Discord is enabled', async () => {
            settingsRepo.findOne.mockResolvedValue({
                discordEnabled: true,
                twitterEnabled: false,
                shareAchievements: true,
                discordWebhookUrl: 'https://discord.com/api/webhooks/test',
            });

            const result = await service.notifyAchievement('user-1', achievement);

            expect(result.discord).toBeDefined();
            expect(result.discord!.success).toBe(true);
            expect(discordService.postAchievement).toHaveBeenCalledWith(
                'https://discord.com/api/webhooks/test',
                expect.objectContaining({ name: 'First Win', userId: 'user-1' }),
            );
        });

        it('should generate Twitter share URL when Twitter is enabled', async () => {
            settingsRepo.findOne.mockResolvedValue({
                discordEnabled: false,
                twitterEnabled: true,
                shareAchievements: true,
            });
            socialAccountRepo.findOne.mockResolvedValue(null);

            const result = await service.notifyAchievement('user-1', achievement);

            expect(result.twitter).toBeDefined();
            expect(result.twitter!.success).toBe(true);
            expect(twitterService.shareAchievement).toHaveBeenCalled();
        });

        it('should post tweet directly when user has linked Twitter account', async () => {
            settingsRepo.findOne.mockResolvedValue({
                discordEnabled: false,
                twitterEnabled: true,
                shareAchievements: true,
            });
            socialAccountRepo.findOne.mockResolvedValue({
                provider: SocialProvider.TWITTER,
                accessToken: 'twitter-token',
            });

            const result = await service.notifyAchievement('user-1', achievement);

            expect(twitterService.postTweet).toHaveBeenCalledWith(
                'twitter-token',
                expect.stringContaining('First Win'),
            );
        });

        it('should notify both platforms when both are enabled', async () => {
            settingsRepo.findOne.mockResolvedValue({
                discordEnabled: true,
                twitterEnabled: true,
                shareAchievements: true,
                discordWebhookUrl: 'https://discord.com/api/webhooks/test',
            });
            socialAccountRepo.findOne.mockResolvedValue(null);

            const result = await service.notifyAchievement('user-1', achievement);

            expect(result.discord).toBeDefined();
            expect(result.twitter).toBeDefined();
        });

        it('should skip notifications when shareAchievements is disabled', async () => {
            settingsRepo.findOne.mockResolvedValue({
                discordEnabled: true,
                twitterEnabled: true,
                shareAchievements: false,
            });

            const result = await service.notifyAchievement('user-1', achievement);

            expect(result.discord).toBeUndefined();
            expect(result.twitter).toBeUndefined();
            expect(discordService.postAchievement).not.toHaveBeenCalled();
        });

        it('should create default settings when none exist', async () => {
            settingsRepo.findOne.mockResolvedValue(null);

            const result = await service.notifyAchievement('new-user', achievement);

            expect(settingsRepo.create).toHaveBeenCalledWith({ userId: 'new-user' });
            expect(settingsRepo.save).toHaveBeenCalled();
        });
    });

    describe('notifyLeaderboardRank', () => {
        const leaderboardData = {
            leaderboardName: 'Global',
            rank: 1,
            score: 5000,
        };

        it('should notify Discord for leaderboard rank', async () => {
            settingsRepo.findOne.mockResolvedValue({
                discordEnabled: true,
                twitterEnabled: false,
                shareLeaderboard: true,
                discordWebhookUrl: 'https://discord.com/api/webhooks/test',
            });

            const result = await service.notifyLeaderboardRank('user-1', leaderboardData);

            expect(result.discord).toBeDefined();
            expect(discordService.postLeaderboardUpdate).toHaveBeenCalled();
        });

        it('should skip when shareLeaderboard is disabled', async () => {
            settingsRepo.findOne.mockResolvedValue({
                discordEnabled: true,
                twitterEnabled: true,
                shareLeaderboard: false,
            });

            const result = await service.notifyLeaderboardRank('user-1', leaderboardData);

            expect(result.discord).toBeUndefined();
            expect(result.twitter).toBeUndefined();
        });
    });
});
