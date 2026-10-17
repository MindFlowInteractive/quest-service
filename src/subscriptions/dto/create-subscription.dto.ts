import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SubscriptionTier, BillingInterval } from '../enums/subscription.enums';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsEnum(BillingInterval)
  billingInterval: BillingInterval;

  /** External payment method ID (e.g., Stripe PaymentMethod ID). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  paymentMethodId?: string;

  /** Promo / coupon code to apply. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;
}
