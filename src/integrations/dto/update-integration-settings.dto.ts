import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIntegrationSettingsDto {
    @ApiPropertyOptional({ description: 'Enable Discord integration' })
    @IsBoolean()
    @IsOptional()
    discordEnabled?: boolean;

    @ApiPropertyOptional({ description: 'Enable Twitter integration' })
    @IsBoolean()
    @IsOptional()
    twitterEnabled?: boolean;

    @ApiPropertyOptional({ description: 'Discord webhook URL for posting' })
    @IsString()
    @IsOptional()
    discordWebhookUrl?: string;

    @ApiPropertyOptional({ description: 'Discord channel ID for bot posting' })
    @IsString()
    @IsOptional()
    discordChannelId?: string;

    @ApiPropertyOptional({ description: 'Auto-share achievements to enabled platforms' })
    @IsBoolean()
    @IsOptional()
    shareAchievements?: boolean;

    @ApiPropertyOptional({ description: 'Auto-share leaderboard rankings to enabled platforms' })
    @IsBoolean()
    @IsOptional()
    shareLeaderboard?: boolean;
}
