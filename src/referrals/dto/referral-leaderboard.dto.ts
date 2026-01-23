import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReferralLeaderboardType {
  TOTAL_REFERRALS = 'total_referrals',
  ACTIVE_REFERRALS = 'active_referrals',
  REWARDS_EARNED = 'rewards_earned',
}

export class ReferralLeaderboardDto {
  @IsOptional()
  @IsEnum(ReferralLeaderboardType)
  type?: ReferralLeaderboardType = ReferralLeaderboardType.TOTAL_REFERRALS;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
