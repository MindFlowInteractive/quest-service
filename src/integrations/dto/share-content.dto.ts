import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialProvider } from '../entities/social-account.entity';

export class ShareContentDto {
    @ApiProperty({ enum: ['discord', 'twitter', 'all'], description: 'Target platform(s)' })
    @IsString()
    @IsNotEmpty()
    platform: 'discord' | 'twitter' | 'all';

    @ApiProperty({ description: 'Type of content to share', enum: ['achievement', 'leaderboard', 'puzzle_completion'] })
    @IsString()
    @IsNotEmpty()
    contentType: 'achievement' | 'leaderboard' | 'puzzle_completion';

    @ApiProperty({ description: 'ID of the content to share (achievement ID, leaderboard ID, etc.)' })
    @IsString()
    @IsNotEmpty()
    contentId: string;

    @ApiPropertyOptional({ description: 'Custom message to include with the share' })
    @IsString()
    @IsOptional()
    customMessage?: string;
}
