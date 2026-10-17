import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Subscription } from './entities/subscription.entity';
import { BillingRecord } from './entities/billing-record.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ChangeTierDto } from './dto/change-tier.dto';
import { SubscriptionAnalyticsQueryDto } from './dto/subscription-analytics-query.dto';
import {
  SubscriptionTier,
  SubscriptionStatus,
  BillingInterval,
  BillingStatus,
} from './enums/subscription.enums';
import { TIER_DEFINITIONS } from './config/tier-definitions';
import {
  BillingProvider,
  BILLING_PROVIDER,
} from './billing/billing-provider.interface';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,

    @InjectRepository(BillingRecord)
    private readonly billingRecordRepo: Repository<BillingRecord>,

    @Inject(BILLING_PROVIDER)
    private readonly billingProvider: BillingProvider,
  ) {}

  // ---------------------------------------------------------------------------
  // Tier catalogue
  // ---------------------------------------------------------------------------

  getTierDefinitions() {
    return Object.values(TIER_DEFINITIONS);
  }

  getTierDefinition(tier: SubscriptionTier) {
    return TIER_DEFINITIONS[tier];
  }

  // ---------------------------------------------------------------------------
  // Create subscription
  // ---------------------------------------------------------------------------

  async createSubscription(
    userId: string,
    dto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    // Prevent duplicate active subscriptions
    const existing = await this.subscriptionRepo.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    if (existing) {
      throw new ConflictException(
        'User already has an active subscription. Use the upgrade/downgrade endpoint instead.',
      );
    }

    const tierDef = TIER_DEFINITIONS[dto.tier];
    if (!tierDef) {
      throw new BadRequestException(`Unknown subscription tier: ${dto.tier}`);
    }

    const priceInCents = tierDef.pricing[dto.billingInterval];
    const now = new Date();

    // Trial period dates
    const trialEndDate =
      tierDef.trialDays > 0
        ? new Date(now.getTime() + tierDef.trialDays * 86_400_000)
        : undefined;

    const periodStart = trialEndDate ?? now;
    const periodEnd = this.computePeriodEnd(periodStart, dto.billingInterval);

    // Create external billing record (only for paid tiers)
    let externalSubscriptionId: string | undefined;
    let externalCustomerId: string | undefined;

    if (priceInCents > 0) {
      const customer = await this.billingProvider.createCustomer(userId, '');
      const extSub = await this.billingProvider.createSubscription(
        customer,
        dto.tier,
        dto.billingInterval,
        dto.paymentMethodId,
      );
      externalSubscriptionId = extSub.externalSubscriptionId;
      externalCustomerId = extSub.externalCustomerId;
    }

    const subscription = this.subscriptionRepo.create({
      userId,
      tier: dto.tier,
      billingInterval: dto.billingInterval,
      status: trialEndDate
        ? SubscriptionStatus.TRIAL
        : SubscriptionStatus.ACTIVE,
      priceInCents,
      externalSubscriptionId,
      externalCustomerId,
      trialStartDate: trialEndDate ? now : undefined,
      trialEndDate,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      autoRenew: true,
    });

    const saved = await this.subscriptionRepo.save(subscription);
    this.logger.log(
      `Subscription created: userId=${userId} tier=${dto.tier} status=${saved.status}`,
    );
    return saved;
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  async findByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
  }

  async findAllByUserId(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Subscription> {
    const sub = await this.subscriptionRepo.findOne({ where: { id } });
    if (!sub) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    return sub;
  }

  // ---------------------------------------------------------------------------
  // Cancellation
  // ---------------------------------------------------------------------------

  async cancelSubscription(
    userId: string,
    dto: CancelSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    if (!subscription) {
      throw new NotFoundException('No active subscription found for this user.');
    }

    const now = new Date();

    // Cancel in external provider if applicable
    if (subscription.externalSubscriptionId) {
      await this.billingProvider.cancelSubscription(
        subscription.externalSubscriptionId,
        dto.immediate ?? false,
      );
    }

    subscription.cancelledAt = now;
    subscription.cancellationReason = dto.reason;
    subscription.autoRenew = false;

    if (dto.immediate) {
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelEffectiveDate = now;
    } else {
      // Stay active until end of current period
      subscription.cancelEffectiveDate = subscription.currentPeriodEnd;
      // Status remains ACTIVE — the renewal cron will flip it at period end
    }

    const saved = await this.subscriptionRepo.save(subscription);
    this.logger.log(
      `Subscription cancelled: userId=${userId} immediate=${dto.immediate} effectiveDate=${saved.cancelEffectiveDate}`,
    );
    return saved;
  }

  // ---------------------------------------------------------------------------
  // Upgrade / Downgrade
  // ---------------------------------------------------------------------------

  async changeTier(userId: string, dto: ChangeTierDto): Promise<Subscription> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    if (!subscription) {
      throw new NotFoundException('No active subscription found for this user.');
    }

    const currentTierOrder = this.tierOrder(subscription.tier);
    const newTierOrder = this.tierOrder(dto.newTier);

    if (currentTierOrder === newTierOrder) {
      throw new BadRequestException('User is already on this tier.');
    }

    const isUpgrade = newTierOrder > currentTierOrder;
    const newInterval = dto.newBillingInterval ?? subscription.billingInterval;
    const newTierDef = TIER_DEFINITIONS[dto.newTier];
    const newPriceInCents = newTierDef.pricing[newInterval];

    if (dto.immediate || isUpgrade) {
      // Apply immediately — charge proration for upgrades
      if (isUpgrade && subscription.priceInCents > 0) {
        const remainingMs =
          subscription.currentPeriodEnd.getTime() - Date.now();
        const totalMs =
          subscription.currentPeriodEnd.getTime() -
          subscription.currentPeriodStart.getTime();
        const fraction = Math.max(0, remainingMs / totalMs);
        const oldRefund = Math.floor(subscription.priceInCents * fraction);
        const prorationCharge = Math.max(
          0,
          Math.floor(newPriceInCents * fraction) - oldRefund,
        );

        if (prorationCharge > 0 && subscription.externalCustomerId) {
          const chargeResult = await this.billingProvider.charge(
            subscription.externalCustomerId,
            prorationCharge,
            'USD',
            `Proration for upgrade to ${dto.newTier}`,
          );

          await this.billingRecordRepo.save(
            this.billingRecordRepo.create({
              userId,
              subscriptionId: subscription.id,
              amountInCents: prorationCharge,
              currency: 'USD',
              status: chargeResult.success
                ? BillingStatus.PAID
                : BillingStatus.FAILED,
              externalPaymentId: chargeResult.externalPaymentId,
              description: `Proration: upgrade to ${dto.newTier}`,
              periodStart: new Date(),
              periodEnd: subscription.currentPeriodEnd,
              failureReason: chargeResult.failureReason,
            }),
          );
        }
      }

      // Update the subscription immediately
      const now = new Date();
      subscription.tier = dto.newTier;
      subscription.billingInterval = newInterval;
      subscription.priceInCents = newPriceInCents;
      subscription.scheduledTier = undefined;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = this.computePeriodEnd(now, newInterval);
    } else {
      // Schedule the change for the next renewal
      subscription.scheduledTier = dto.newTier;
    }

    const saved = await this.subscriptionRepo.save(subscription);
    this.logger.log(
      `Tier change: userId=${userId} ${subscription.tier}→${dto.newTier} immediate=${dto.immediate}`,
    );
    return saved;
  }

  // ---------------------------------------------------------------------------
  // Feature gating helper
  // ---------------------------------------------------------------------------

  async getUserFeatures(userId: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    const tier = subscription?.tier ?? SubscriptionTier.FREE;
    return TIER_DEFINITIONS[tier].features;
  }

  async hasFeature(
    userId: string,
    feature: keyof (typeof TIER_DEFINITIONS)[SubscriptionTier.FREE]['features'],
  ): Promise<boolean> {
    const features = await this.getUserFeatures(userId);
    const value = features[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0; // -1 = unlimited, 0 = locked
    return false;
  }

  async getUserTier(userId: string): Promise<SubscriptionTier> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
    return subscription?.tier ?? SubscriptionTier.FREE;
  }

  // ---------------------------------------------------------------------------
  // Auto-renewal cron (runs daily at midnight UTC)
  // ---------------------------------------------------------------------------

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processAutoRenewals(): Promise<void> {
    this.logger.log('Auto-renewal cron started');
    const now = new Date();

    // Find subscriptions whose period has ended and auto-renew is enabled
    const due = await this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        currentPeriodEnd: MoreThan(
          new Date(now.getTime() - 86_400_000), // within last 24h
        ),
      },
    });

    for (const subscription of due) {
      if (subscription.currentPeriodEnd <= now) {
        await this.renewSubscription(subscription);
      }
    }

    // Also cancel subscriptions that passed their cancelEffectiveDate
    await this.expireCancelledSubscriptions(now);

    // Flip TRIAL → ACTIVE when trial period ends
    await this.activateExpiredTrials(now);

    this.logger.log(`Auto-renewal cron complete. Processed ${due.length} subscriptions.`);
  }

  private async renewSubscription(subscription: Subscription): Promise<void> {
    // Apply any scheduled tier change
    if (subscription.scheduledTier) {
      const newTierDef = TIER_DEFINITIONS[subscription.scheduledTier];
      subscription.tier = subscription.scheduledTier;
      subscription.priceInCents =
        newTierDef.pricing[subscription.billingInterval];
      subscription.scheduledTier = undefined;
    }

    const newPeriodStart = subscription.currentPeriodEnd;
    const newPeriodEnd = this.computePeriodEnd(
      newPeriodStart,
      subscription.billingInterval,
    );

    if (subscription.priceInCents > 0 && subscription.externalCustomerId) {
      const chargeResult = await this.billingProvider.charge(
        subscription.externalCustomerId,
        subscription.priceInCents,
        'USD',
        `${subscription.tier} ${subscription.billingInterval} renewal`,
      );

      const billingRecord = this.billingRecordRepo.create({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        amountInCents: subscription.priceInCents,
        currency: 'USD',
        status: chargeResult.success ? BillingStatus.PAID : BillingStatus.FAILED,
        externalPaymentId: chargeResult.externalPaymentId,
        description: `${subscription.tier} ${subscription.billingInterval} renewal`,
        periodStart: newPeriodStart,
        periodEnd: newPeriodEnd,
        failureReason: chargeResult.failureReason,
      });
      await this.billingRecordRepo.save(billingRecord);

      if (!chargeResult.success) {
        subscription.failedBillingAttempts += 1;
        if (subscription.failedBillingAttempts >= 3) {
          subscription.status = SubscriptionStatus.PAST_DUE;
          this.logger.warn(
            `Subscription ${subscription.id} marked past_due after ${subscription.failedBillingAttempts} failed attempts`,
          );
        }
        await this.subscriptionRepo.save(subscription);
        return;
      }

      subscription.failedBillingAttempts = 0;
      subscription.successfulBillingCycles += 1;
    }

    subscription.currentPeriodStart = newPeriodStart;
    subscription.currentPeriodEnd = newPeriodEnd;
    await this.subscriptionRepo.save(subscription);

    this.logger.log(
      `Renewed subscription ${subscription.id} → period ends ${newPeriodEnd.toISOString()}`,
    );
  }

  private async expireCancelledSubscriptions(now: Date): Promise<void> {
    const toExpire = await this.subscriptionRepo.find({
      where: {
        autoRenew: false,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    for (const sub of toExpire) {
      if (sub.cancelEffectiveDate && sub.cancelEffectiveDate <= now) {
        sub.status = SubscriptionStatus.CANCELLED;
        await this.subscriptionRepo.save(sub);
        this.logger.log(`Subscription ${sub.id} expired after cancellation.`);
      }
    }
  }

  private async activateExpiredTrials(now: Date): Promise<void> {
    const trials = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.TRIAL },
    });

    for (const sub of trials) {
      if (sub.trialEndDate && sub.trialEndDate <= now) {
        sub.status = SubscriptionStatus.ACTIVE;
        sub.currentPeriodStart = sub.trialEndDate;
        sub.currentPeriodEnd = this.computePeriodEnd(
          sub.trialEndDate,
          sub.billingInterval,
        );
        await this.subscriptionRepo.save(sub);
        this.logger.log(`Trial converted to active: subscription ${sub.id}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------

  async getAnalytics(query: SubscriptionAnalyticsQueryDto) {
    const from = query.from ? new Date(query.from) : new Date('2000-01-01');
    const to = query.to ? new Date(query.to) : new Date();

    const qb = this.subscriptionRepo
      .createQueryBuilder('s')
      .where('s.createdAt BETWEEN :from AND :to', { from, to });

    if (query.tier) {
      qb.andWhere('s.tier = :tier', { tier: query.tier });
    }

    const all = await qb.getMany();

    // Aggregate by tier
    const byTier: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const sub of all) {
      byTier[sub.tier] = (byTier[sub.tier] ?? 0) + 1;
      byStatus[sub.status] = (byStatus[sub.status] ?? 0) + 1;
    }

    // Monthly Recurring Revenue (MRR) — sum of active monthly-equiv prices
    const active = all.filter((s) => s.status === SubscriptionStatus.ACTIVE);
    const mrr = active.reduce((acc, s) => {
      const monthly =
        s.billingInterval === BillingInterval.MONTHLY
          ? s.priceInCents
          : Math.round(s.priceInCents / 12);
      return acc + monthly;
    }, 0);

    // Retention: subscriptions with > 1 successful billing cycle
    const retained = active.filter(
      (s) => s.successfulBillingCycles > 1,
    ).length;
    const retentionRate = active.length
      ? ((retained / active.length) * 100).toFixed(2)
      : '0.00';

    // Churn: cancellations in window
    const churned = all.filter(
      (s) => s.status === SubscriptionStatus.CANCELLED,
    ).length;

    // Billing revenue in window
    const billingQb = this.billingRecordRepo
      .createQueryBuilder('b')
      .where('b.createdAt BETWEEN :from AND :to', { from, to })
      .andWhere('b.status = :status', { status: BillingStatus.PAID });

    if (query.tier) {
      // join not available without relation; skip tier filter on billing in this simplified view
    }

    const paidRecords = await billingQb.getMany();
    const totalRevenueCents = paidRecords.reduce(
      (acc, r) => acc + r.amountInCents,
      0,
    );

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalSubscriptions: all.length,
      activeSubscriptions: active.length,
      byTier,
      byStatus,
      mrrCents: mrr,
      mrrUsd: (mrr / 100).toFixed(2),
      totalRevenueCents,
      totalRevenueUsd: (totalRevenueCents / 100).toFixed(2),
      churnCount: churned,
      retentionRate: `${retentionRate}%`,
    };
  }

  async getBillingHistory(userId: string): Promise<BillingRecord[]> {
    return this.billingRecordRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private computePeriodEnd(start: Date, interval: BillingInterval): Date {
    const end = new Date(start);
    if (interval === BillingInterval.MONTHLY) {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }
    return end;
  }

  private tierOrder(tier: SubscriptionTier): number {
    const order: Record<SubscriptionTier, number> = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.BASIC]: 1,
      [SubscriptionTier.PRO]: 2,
      [SubscriptionTier.ENTERPRISE]: 3,
    };
    return order[tier];
  }
}
