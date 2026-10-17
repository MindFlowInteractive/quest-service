import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SubscriptionTier } from '../enums/subscription.enums';

export class SubscriptionAnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier;
}
