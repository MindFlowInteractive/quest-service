import { SetMetadata } from '@nestjs/common';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIER_KEY,
} from '../enums/subscription.enums';

/**
 * Marks a route as requiring a minimum subscription tier.
 * Pair with SubscriptionTierGuard.
 *
 * @example
 *   @RequireSubscriptionTier(SubscriptionTier.PRO)
 *   @UseGuards(JwtAuthGuard, SubscriptionTierGuard)
 *   @Get('advanced-analytics')
 */
export const RequireSubscriptionTier = (tier: SubscriptionTier) =>
  SetMetadata(SUBSCRIPTION_TIER_KEY, tier);
