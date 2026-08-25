import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  questAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  questCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  questApproved?: boolean;

  @IsOptional()
  @IsBoolean()
  questRejected?: boolean;

  @IsOptional()
  @IsBoolean()
  rewardReceived?: boolean;

  @IsOptional()
  @IsBoolean()
  achievementUnlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  levelUp?: boolean;

  @IsOptional()
  @IsBoolean()
  badgeEarned?: boolean;

  @IsOptional()
  @IsBoolean()
  system?: boolean;
}
