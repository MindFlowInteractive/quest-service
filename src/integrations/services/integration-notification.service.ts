import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationSettings } from '../entities/integration-settings.entity';
import { SocialAccount, SocialProvider } from '../entities/social-account.entity';
import { DiscordService } from './discord.service';
import { TwitterService, TwitterShareResult } from './twitter.service';

export interface NotificationResult {
    discord?: { success: boolean; message: string };
    twitter?: TwitterShareResult;
}

@Injectable()
export class IntegrationNotificationService {
    private readonly logger = new Logger(IntegrationNotificationService.name);

    constructor(
        @InjectRepository(IntegrationSettings)
        private readonly settingsRepo: Repository<IntegrationSettings>,
        @InjectRepository(SocialAccount)
        private readonly socialAccountRepo: Repository<SocialAccount>,
        private readonly discordService: DiscordService,
        private readonly twitterService: TwitterService,
    ) { }

    /**
     * Notify about an achievement unlock across all enabled platforms.
     */
    async notifyAchievement(
        userId: string,
        achievement: { name: string; description: string; iconUrl?: string; achievementId: string },
    ): Promise<NotificationResult> {
        const settings = await this.getOrCreateSettings(userId);
        const result: NotificationResult = {};

        if (!settings.shareAchievements) {
            this.logger.log(`User ${userId} has achievement sharing disabled`);
            return result;
        }

        // Discord
        if (settings.discordEnabled) {
            result.discord = await this.discordService.postAchievement(
                settings.discordWebhookUrl,
                { ...achievement, userId },
            );
        }

        // Twitter
        if (settings.twitterEnabled) {
            result.twitter = this.twitterService.shareAchievement(achievement);

            // If user has a linked Twitter account, also post directly
            const twitterAccount = await this.socialAccountRepo.findOne({
                where: { userId, provider: SocialProvider.TWITTER },
            });
            if (twitterAccount?.accessToken) {
                const tweetText = `🏆 I just unlocked "${achievement.name}" on Quest Service!\n\n${achievement.description}\n\n#QuestService #Achievement`;
                result.twitter = await this.twitterService.postTweet(
                    twitterAccount.accessToken,
                    tweetText,
                );
            }
        }

        return result;
    }

    /**
     * Notify about a leaderboard ranking across all enabled platforms.
     */
    async notifyLeaderboardRank(
        userId: string,
        leaderboardData: { leaderboardName: string; rank: number; score: number },
    ): Promise<NotificationResult> {
        const settings = await this.getOrCreateSettings(userId);
        const result: NotificationResult = {};

        if (!settings.shareLeaderboard) {
            return result;
        }

        // Discord
        if (settings.discordEnabled) {
            result.discord = await this.discordService.postLeaderboardUpdate(
                settings.discordWebhookUrl,
                {
                    name: leaderboardData.leaderboardName,
                    entries: [{ rank: leaderboardData.rank, playerName: userId, score: leaderboardData.score }],
                },
            );
        }

        // Twitter
        if (settings.twitterEnabled) {
            result.twitter = this.twitterService.shareLeaderboardRank(leaderboardData);
        }

        return result;
    }

    /**
     * Get or create default integration settings for a user.
     */
    private async getOrCreateSettings(userId: string): Promise<IntegrationSettings> {
        let settings = await this.settingsRepo.findOne({ where: { userId } });
        if (!settings) {
            settings = this.settingsRepo.create({ userId });
            settings = await this.settingsRepo.save(settings);
        }
        return settings;
    }
}
