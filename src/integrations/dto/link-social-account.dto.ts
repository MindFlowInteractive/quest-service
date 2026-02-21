import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SocialProvider } from '../entities/social-account.entity';

export class LinkSocialAccountDto {
    @ApiProperty({ enum: SocialProvider, description: 'Social platform provider' })
    @IsEnum(SocialProvider)
    @IsNotEmpty()
    provider: SocialProvider;

    @ApiProperty({ description: 'OAuth authorization code from the provider' })
    @IsString()
    @IsNotEmpty()
    authorizationCode: string;

    @ApiPropertyOptional({ description: 'OAuth redirect URI used during authorization' })
    @IsString()
    @IsOptional()
    redirectUri?: string;
}
