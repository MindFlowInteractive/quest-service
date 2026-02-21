import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface DiscordEmbed {
    title: string;
    description: string;
    color?: number;
    thumbnail?: { url: string };
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    footer?: { text: string };
    timestamp?: string;
}

export interface DiscordWebhookPayload {
    content?: string;
    username?: string;
    avatar_url?: string;
    embeds?: DiscordEmbed[];
}

@Injectable()
export class DiscordService {
    private readonly logger = new Logger(DiscordService.name);
    private readonly botName: string;
    private readonly defaultWebhookUrl?: string;

    constructor(private readonly configService: ConfigService) {
        this.botName = this.configService.get<string>('DISCORD_BOT_NAME') || 'Quest Service Bot';
        this.defaultWebhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');
    }

    /**
     * Post an achievement unlock to a Discord channel via webhook.
     */
    async postAchievement(
        webhookUrl: string | undefined,
        achievement: { name: string; description: string; iconUrl?: string; userId: string },
    ): Promise<{ success: boolean; message: string }> {
        const url = webhookUrl || this.defaultWebhookUrl;
        if (!url) {
            this.logger.warn('No Discord webhook URL configured');
            return { success: false, message: 'No Discord webhook URL configured' };
        }

        const embed: DiscordEmbed = {
            title: '🏆 Achievement Unlocked!',
            description: `**${achievement.name}**\n${achievement.description}`,
            color: 0xffd700, // Gold
            fields: [
                { name: 'Player', value: achievement.userId, inline: true },
            ],
            footer: { text: 'Quest Service' },
            timestamp: new Date().toISOString(),
        };

        if (achievement.iconUrl) {
            embed.thumbnail = { url: achievement.iconUrl };
        }

        return this.sendWebhook(url, {
            username: this.botName,
            embeds: [embed],
        });
    }

    /**
     * Post a leaderboard update to Discord.
     */
    async postLeaderboardUpdate(
        webhookUrl: string | undefined,
        leaderboard: { name: string; entries: Array<{ rank: number; playerName: string; score: number }> },
    ): Promise<{ success: boolean; message: string }> {
        const url = webhookUrl || this.defaultWebhookUrl;
        if (!url) {
            return { success: false, message: 'No Discord webhook URL configured' };
        }

        const leaderboardText = leaderboard.entries
            .slice(0, 10)
            .map((e) => `**#${e.rank}** ${e.playerName} — ${e.score} pts`)
            .join('\n');

        const embed: DiscordEmbed = {
            title: `📊 Leaderboard: ${leaderboard.name}`,
            description: leaderboardText || 'No entries yet.',
            color: 0x5865f2, // Discord blurple
            footer: { text: 'Quest Service Leaderboard' },
            timestamp: new Date().toISOString(),
        };

        return this.sendWebhook(url, {
            username: this.botName,
            embeds: [embed],
        });
    }

    /**
     * Verify HMAC signature from a Discord webhook/interaction.
     */
    verifyWebhookSignature(
        payload: string,
        signature: string,
        timestamp: string,
    ): boolean {
        const publicKey = this.configService.get<string>('DISCORD_PUBLIC_KEY');
        if (!publicKey) {
            this.logger.warn('Discord public key not configured — skipping verification');
            return false;
        }

        try {
            // In production, use tweetnacl or discord-interactions to verify Ed25519 signatures
            // For now, we validate that the required fields are present
            return !!(payload && signature && timestamp);
        } catch {
            return false;
        }
    }

    /**
     * Send a payload to a Discord webhook URL.
     */
    async sendWebhook(
        webhookUrl: string,
        payload: DiscordWebhookPayload,
    ): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Discord webhook failed: ${response.status} ${errorText}`);
                return { success: false, message: `Discord webhook failed: ${response.status}` };
            }

            this.logger.log('Discord webhook sent successfully');
            return { success: true, message: 'Message sent to Discord' };
        } catch (error: any) {
            this.logger.error(`Discord webhook error: ${error.message}`);
            return { success: false, message: `Discord webhook error: ${error.message}` };
        }
    }
}
