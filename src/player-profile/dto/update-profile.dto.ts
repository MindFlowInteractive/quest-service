import { IsOptional, IsString, ValidateNested, Type } from 'class-validator';
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
  bio?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacySettings?: PrivacySettingsDto;
}