import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TwitterShareResult {
    success: boolean;
    shareUrl?: string;
    message: string;
}

@Injectable()
export class TwitterService {
    private readonly logger = new Logger(TwitterService.name);
    private readonly appUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.appUrl = this.configService.get<string>('APP_URL') || 'https://questservice.com';
    }

    /**
     * Generate a Twitter Web Intent URL for sharing a puzzle completion.
     * This allows client-side sharing without needing API keys.
     */
    sharePuzzleCompletion(
        puzzleData: { puzzleName: string; score?: number; timeSeconds?: number },
        customMessage?: string,
    ): TwitterShareResult {
        const defaultText = this.buildPuzzleCompletionText(puzzleData);
        const text = customMessage || defaultText;
        const shareUrl = this.generateShareUrl(text, `${this.appUrl}/puzzles`);

        return {
            success: true,
            shareUrl,
            message: 'Twitter share URL generated',
        };
    }

    /**
     * Generate a Twitter Web Intent URL for sharing an achievement.
     */
    shareAchievement(
        achievement: { name: string; description: string; achievementId: string },
        customMessage?: string,
    ): TwitterShareResult {
        const defaultText = `🏆 I just unlocked "${achievement.name}" on Quest Service!\n\n${achievement.description}\n\n#QuestService #Gaming #Achievement`;
        const text = customMessage || defaultText;
        const url = `${this.appUrl}/achievements/${achievement.achievementId}`;
        const shareUrl = this.generateShareUrl(text, url);

        return {
            success: true,
            shareUrl,
            message: 'Twitter share URL generated',
        };
    }

    /**
     * Generate a Twitter Web Intent URL for sharing leaderboard rank.
     */
    shareLeaderboardRank(
        leaderboardData: { leaderboardName: string; rank: number; score: number },
        customMessage?: string,
    ): TwitterShareResult {
        const defaultText = `📊 I'm ranked #${leaderboardData.rank} on the "${leaderboardData.leaderboardName}" leaderboard with ${leaderboardData.score} points!\n\n#QuestService #Leaderboard #Gaming`;
        const text = customMessage || defaultText;
        const shareUrl = this.generateShareUrl(text, `${this.appUrl}/leaderboard`);

        return {
            success: true,
            shareUrl,
            message: 'Twitter share URL generated',
        };
    }

    /**
     * Post a tweet using the Twitter API v2 (requires user's OAuth2 access token).
     * This is the server-side posting method for users who have linked their Twitter account.
     */
    async postTweet(
        accessToken: string,
        text: string,
    ): Promise<TwitterShareResult> {
        const apiUrl = 'https://api.twitter.com/2/tweets';

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                this.logger.error(`Twitter API error: ${response.status} - ${errorData}`);
                return { success: false, message: `Twitter API error: ${response.status}` };
            }

            const data: any = await response.json();
            return {
                success: true,
                shareUrl: `https://twitter.com/i/web/status/${data.data?.id}`,
                message: 'Tweet posted successfully',
            };
        } catch (error: any) {
            this.logger.error(`Twitter post error: ${error.message}`);
            return { success: false, message: `Twitter post error: ${error.message}` };
        }
    }

    /**
     * Generate a Twitter Web Intent URL for client-side sharing.
     */
    generateShareUrl(text: string, url?: string): string {
        const params = new URLSearchParams();
        params.set('text', text);
        if (url) {
            params.set('url', url);
        }
        return `https://twitter.com/intent/tweet?${params.toString()}`;
    }

    private buildPuzzleCompletionText(puzzleData: {
        puzzleName: string;
        score?: number;
        timeSeconds?: number;
    }): string {
        let text = `🧩 I just completed "${puzzleData.puzzleName}" on Quest Service!`;

        if (puzzleData.score !== undefined) {
            text += `\n⭐ Score: ${puzzleData.score}`;
        }
        if (puzzleData.timeSeconds !== undefined) {
            const minutes = Math.floor(puzzleData.timeSeconds / 60);
            const seconds = puzzleData.timeSeconds % 60;
            text += `\n⏱️ Time: ${minutes}m ${seconds}s`;
        }

        text += '\n\n#QuestService #PuzzleGame #Gaming';
        return text;
    }
}
