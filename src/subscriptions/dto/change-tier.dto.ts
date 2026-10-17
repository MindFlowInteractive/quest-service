import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { SubscriptionTier, BillingInterval } from '../enums/subscription.enums';

export class ChangeTierDto {
  @IsEnum(SubscriptionTier)
  newTier: SubscriptionTier;

  @IsOptional()
  @IsEnum(BillingInterval)
  newBillingInterval?: BillingInterval;

  /**
   * When true, the change applies immediately (prorating if applicable).
   * When false (default), it is scheduled for the next renewal date.
   */
  @IsOptional()
  @IsBoolean()
  immediate?: boolean = false;
}
