import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subscription } from './entities/subscription.entity';
import { BillingRecord } from './entities/billing-record.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionTierGuard } from './guards/subscription-tier.guard';
import { MockBillingProvider } from './billing/mock-billing.provider';
import { BILLING_PROVIDER } from './billing/billing-provider.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, BillingRecord])],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionTierGuard,
    {
      provide: BILLING_PROVIDER,
      useClass: MockBillingProvider,
      // To swap in a real provider:
      // useClass: StripeBillingProvider,
    },
  ],
  exports: [
    SubscriptionsService,
    SubscriptionTierGuard,
    // Export the guard so other modules can use @RequireSubscriptionTier
  ],
})
export class SubscriptionsModule {}
