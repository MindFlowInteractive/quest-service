import { IsOptional, IsString, ValidateNested, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PrivacySettingsDto } from './privacy-settings.dto';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bannerTheme?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @IsOptional()
  @IsObject()
  socialLinks?: {
    twitter?: string;
    discord?: string;
    twitch?: string;
    youtube?: string;
    github?: string;
  };

  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacySettings?: PrivacySettingsDto;

  @IsOptional()
  @IsObject()
  displayPreferences?: {
    theme?: string;
    badgeLayout?: 'grid' | 'list' | 'compact';
    showAchievementProgress?: boolean;
    profileLayout?: 'default' | 'compact' | 'detailed';
  };
}
