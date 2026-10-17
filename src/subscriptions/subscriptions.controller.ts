import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ChangeTierDto } from './dto/change-tier.dto';
import { SubscriptionAnalyticsQueryDto } from './dto/subscription-analytics-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants';
import { SubscriptionTierGuard } from './guards/subscription-tier.guard';
import { RequireSubscriptionTier } from './decorators/require-subscription-tier.decorator';
import { SubscriptionTier } from './enums/subscription.enums';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ---------------------------------------------------------------------------
  // Public — tier catalogue
  // ---------------------------------------------------------------------------

  /** List all available subscription tiers and their features. */
  @Get('tiers')
  getTiers() {
    return this.subscriptionsService.getTierDefinitions();
  }

  /** Get a single tier definition by name. */
  @Get('tiers/:tier')
  getTier(@Param('tier') tier: SubscriptionTier) {
    return this.subscriptionsService.getTierDefinition(tier);
  }

  // ---------------------------------------------------------------------------
  // Authenticated user endpoints
  // ---------------------------------------------------------------------------

  /** Subscribe the authenticated user to a tier. */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createSubscription(
    @Request() req: any,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(req.user.id, dto);
  }

  /** Get the current active subscription for the authenticated user. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentSubscription(@Request() req: any) {
    return this.subscriptionsService.findByUserId(req.user.id);
  }

  /** Get the full subscription history for the authenticated user. */
  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  getSubscriptionHistory(@Request() req: any) {
    return this.subscriptionsService.findAllByUserId(req.user.id);
  }

  /** Get billing history for the authenticated user. */
  @Get('me/billing')
  @UseGuards(JwtAuthGuard)
  getBillingHistory(@Request() req: any) {
    return this.subscriptionsService.getBillingHistory(req.user.id);
  }

  /** Get the features available on the user's current tier. */
  @Get('me/features')
  @UseGuards(JwtAuthGuard)
  getMyFeatures(@Request() req: any) {
    return this.subscriptionsService.getUserFeatures(req.user.id);
  }

  /** Upgrade or downgrade to a different tier. */
  @Patch('me/tier')
  @UseGuards(JwtAuthGuard)
  changeTier(@Request() req: any, @Body() dto: ChangeTierDto) {
    return this.subscriptionsService.changeTier(req.user.id, dto);
  }

  /** Cancel the authenticated user's subscription. */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cancelSubscription(
    @Request() req: any,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionsService.cancelSubscription(req.user.id, dto);
  }

  // ---------------------------------------------------------------------------
  // Example premium-gated route
  // ---------------------------------------------------------------------------

  /**
   * Example: an endpoint that is only accessible to PRO subscribers.
   * Any controller in the wider app can use @RequireSubscriptionTier +
   * @UseGuards(JwtAuthGuard, SubscriptionTierGuard) in the same way.
   */
  @Get('premium/advanced-analytics')
  @UseGuards(JwtAuthGuard, SubscriptionTierGuard)
  @RequireSubscriptionTier(SubscriptionTier.PRO)
  getPremiumAnalytics(@Request() req: any) {
    // Placeholder — real implementation would call a dedicated analytics service
    return { message: 'Welcome to Pro analytics!', userId: req.user.id };
  }

  // ---------------------------------------------------------------------------
  // Admin endpoints
  // ---------------------------------------------------------------------------

  /** [Admin] Get a subscription by its ID. */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findById(@Param('id') id: string) {
    return this.subscriptionsService.findById(id);
  }

  /** [Admin] Get aggregated subscription analytics. */
  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAnalytics(@Query() query: SubscriptionAnalyticsQueryDto) {
    return this.subscriptionsService.getAnalytics(query);
  }

  /** [Admin] Manually trigger the auto-renewal cycle (useful for testing). */
  @Post('admin/renew')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  triggerRenewal() {
    return this.subscriptionsService.processAutoRenewals();
  }
}
