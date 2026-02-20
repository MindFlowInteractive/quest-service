import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TwitterService } from '../services/twitter.service';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('TwitterService', () => {
    let service: TwitterService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TwitterService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config: Record<string, string> = {
                                APP_URL: 'https://questservice.com',
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<TwitterService>(TwitterService);
        mockFetch.mockClear();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateShareUrl', () => {
        it('should generate a valid Twitter intent URL with text', () => {
            const url = service.generateShareUrl('Hello world!');
            expect(url).toContain('https://twitter.com/intent/tweet');
            expect(url).toContain('text=Hello');
        });

        it('should include URL parameter when provided', () => {
            const url = service.generateShareUrl('Check this out', 'https://example.com');
            expect(url).toContain('text=Check');
            expect(url).toContain('url=https');
        });
    });

    describe('sharePuzzleCompletion', () => {
        it('should return a share URL for puzzle completion', () => {
            const result = service.sharePuzzleCompletion({
                puzzleName: 'Logic Puzzle #1',
                score: 95,
                timeSeconds: 125,
            });

            expect(result.success).toBe(true);
            expect(result.shareUrl).toContain('twitter.com/intent/tweet');
            expect(result.shareUrl).toContain('Logic+Puzzle');
            expect(result.message).toBe('Twitter share URL generated');
        });

        it('should use custom message when provided', () => {
            const result = service.sharePuzzleCompletion(
                { puzzleName: 'Test' },
                'My custom share message!',
            );

            expect(result.success).toBe(true);
            expect(result.shareUrl).toContain('custom+share+message');
        });

        it('should include score and time in default text', () => {
            const result = service.sharePuzzleCompletion({
                puzzleName: 'Advanced Puzzle',
                score: 100,
                timeSeconds: 65,
            });

            expect(result.shareUrl).toContain('Score');
            expect(result.shareUrl).toContain('Time');
        });
    });

    describe('shareAchievement', () => {
        it('should return a share URL for an achievement', () => {
            const result = service.shareAchievement({
                name: 'Master Puzzler',
                description: 'Complete 100 puzzles',
                achievementId: 'ach-123',
            });

            expect(result.success).toBe(true);
            expect(result.shareUrl).toContain('twitter.com/intent/tweet');
            expect(result.shareUrl).toContain('Master+Puzzler');
            expect(result.shareUrl).toContain('questservice.com');
        });
    });

    describe('shareLeaderboardRank', () => {
        it('should return a share URL for a leaderboard ranking', () => {
            const result = service.shareLeaderboardRank({
                leaderboardName: 'Global Ranking',
                rank: 5,
                score: 2500,
            });

            expect(result.success).toBe(true);
            expect(result.shareUrl).toContain('twitter.com/intent/tweet');
            expect(result.shareUrl).toContain('Global+Ranking');
            expect(result.shareUrl).toContain('2500');
        });
    });

    describe('postTweet', () => {
        it('should post a tweet via Twitter API', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: { id: 'tweet-123' } }),
            });

            const result = await service.postTweet('mock-access-token', 'Hello from Quest Service!');

            expect(result.success).toBe(true);
            expect(result.shareUrl).toContain('tweet-123');
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.twitter.com/2/tweets',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        Authorization: 'Bearer mock-access-token',
                        'Content-Type': 'application/json',
                    },
                }),
            );
        });

        it('should handle Twitter API errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                text: () => Promise.resolve('Forbidden'),
            });

            const result = await service.postTweet('bad-token', 'Test');

            expect(result.success).toBe(false);
            expect(result.message).toContain('403');
        });

        it('should handle network failures', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

            const result = await service.postTweet('token', 'Test');

            expect(result.success).toBe(false);
            expect(result.message).toContain('Connection refused');
        });
    });
});
