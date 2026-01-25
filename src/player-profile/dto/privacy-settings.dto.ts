import { IsOptional, IsBoolean } from 'class-validator';

export class PrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  isProfilePublic?: boolean;

  @IsOptional()
  @IsBoolean()
  showBadges?: boolean;

  @IsOptional()
  @IsBoolean()
  showBio?: boolean;
}