import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIER_KEY,
} from '../enums/subscription.enums';

/**
 * Guards a route so only users on the required subscription tier (or higher)
 * can access it.
 *
 * Usage:
 *   @RequireSubscriptionTier(SubscriptionTier.PRO)
 *   @UseGuards(JwtAuthGuard, SubscriptionTierGuard)
 *   @Get('some-premium-route')
 */
@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  private readonly tierOrder: Record<SubscriptionTier, number> = {
    [SubscriptionTier.FREE]: 0,
    [SubscriptionTier.BASIC]: 1,
    [SubscriptionTier.PRO]: 2,
    [SubscriptionTier.ENTERPRISE]: 3,
  };

  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier>(
      SUBSCRIPTION_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No tier requirement set — allow through
    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.id ?? request.user?.sub;

    if (!userId) {
      throw new ForbiddenException('Authentication required.');
    }

    const userTier = await this.subscriptionsService.getUserTier(userId);

    if (this.tierOrder[userTier] < this.tierOrder[requiredTier]) {
      throw new ForbiddenException(
        `This feature requires a ${requiredTier} subscription or higher.`,
      );
    }

    return true;
  }
}
