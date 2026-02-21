import { IsBoolean, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';

export class UpdatePrivacySettingsDto {
  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;

  @IsBoolean()
  @IsOptional()
  analyticsConsent?: boolean;

  @IsBoolean()
  @IsOptional()
  personalizationConsent?: boolean;

  @IsBoolean()
  @IsOptional()
  thirdPartySharingConsent?: boolean;

  @IsBoolean()
  @IsOptional()
  blockchainConsent?: boolean;

  @IsInt()
  @Min(30)
  @Max(2555) // ~7 years
  @IsOptional()
  dataRetentionDays?: number;

  @IsBoolean()
  @IsOptional()
  autoDeleteEnabled?: boolean;

  @IsInt()
  @Min(1)
  @Max(365)
  @IsOptional()
  autoDeleteAfterDays?: number;

  @IsBoolean()
  @IsOptional()
  profilePublic?: boolean;

  @IsBoolean()
  @IsOptional()
  showOnLeaderboard?: boolean;

  @IsBoolean()
  @IsOptional()
  allowFriendRequests?: boolean;
}
