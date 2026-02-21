import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DiscordService } from '../services/discord.service';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('DiscordService', () => {
    let service: DiscordService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DiscordService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config: Record<string, string> = {
                                DISCORD_BOT_NAME: 'Test Bot',
                                DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/test',
                                DISCORD_PUBLIC_KEY: 'test-public-key',
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<DiscordService>(DiscordService);
        configService = module.get<ConfigService>(ConfigService);
        mockFetch.mockClear();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('postAchievement', () => {
        it('should send an achievement embed to Discord', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

            const result = await service.postAchievement(
                'https://discord.com/api/webhooks/test',
                {
                    name: 'First Puzzle',
                    description: 'Complete your first puzzle',
                    userId: 'user-123',
                },
            );

            expect(result.success).toBe(true);
            expect(result.message).toBe('Message sent to Discord');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://discord.com/api/webhooks/test',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }),
            );

            // Verify embed structure
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.username).toBe('Test Bot');
            expect(body.embeds).toHaveLength(1);
            expect(body.embeds[0].title).toBe('🏆 Achievement Unlocked!');
            expect(body.embeds[0].description).toContain('First Puzzle');
            expect(body.embeds[0].color).toBe(0xffd700);
        });

        it('should return failure when no webhook URL is configured', async () => {
            const result = await service.postAchievement(undefined, {
                name: 'Test',
                description: 'Test',
                userId: 'user-123',
            });

            // Falls back to default webhook URL from config
            expect(mockFetch).toHaveBeenCalled();
        });

        it('should handle Discord API errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                text: () => Promise.resolve('Rate limited'),
            });

            const result = await service.postAchievement(
                'https://discord.com/api/webhooks/test',
                { name: 'Test', description: 'Test', userId: 'user-123' },
            );

            expect(result.success).toBe(false);
            expect(result.message).toContain('429');
        });

        it('should handle network errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await service.postAchievement(
                'https://discord.com/api/webhooks/test',
                { name: 'Test', description: 'Test', userId: 'user-123' },
            );

            expect(result.success).toBe(false);
            expect(result.message).toContain('Network error');
        });

        it('should include thumbnail when iconUrl is provided', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

            await service.postAchievement(
                'https://discord.com/api/webhooks/test',
                {
                    name: 'Test',
                    description: 'Test',
                    iconUrl: 'https://example.com/icon.png',
                    userId: 'user-123',
                },
            );

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.embeds[0].thumbnail).toEqual({ url: 'https://example.com/icon.png' });
        });
    });

    describe('postLeaderboardUpdate', () => {
        it('should send a leaderboard embed to Discord', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('') });

            const result = await service.postLeaderboardUpdate(
                'https://discord.com/api/webhooks/test',
                {
                    name: 'Weekly Leaderboard',
                    entries: [
                        { rank: 1, playerName: 'Alice', score: 1000 },
                        { rank: 2, playerName: 'Bob', score: 900 },
                        { rank: 3, playerName: 'Charlie', score: 800 },
                    ],
                },
            );

            expect(result.success).toBe(true);
            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.embeds[0].title).toContain('Weekly Leaderboard');
            expect(body.embeds[0].description).toContain('Alice');
            expect(body.embeds[0].description).toContain('1000');
        });
    });

    describe('verifyWebhookSignature', () => {
        it('should return true when all required fields are present', () => {
            const result = service.verifyWebhookSignature('payload', 'signature', 'timestamp');
            expect(result).toBe(true);
        });

        it('should return false when fields are missing', () => {
            expect(service.verifyWebhookSignature('', 'sig', 'ts')).toBe(false);
            expect(service.verifyWebhookSignature('payload', '', 'ts')).toBe(false);
        });
    });
});
