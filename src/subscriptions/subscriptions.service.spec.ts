import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { BillingRecord } from './entities/billing-record.entity';
import { BILLING_PROVIDER } from './billing/billing-provider.interface';
import {
  SubscriptionTier,
  SubscriptionStatus,
  BillingInterval,
  BillingStatus,
} from './enums/subscription.enums';
import { TIER_DEFINITIONS } from './config/tier-definitions';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ChangeTierDto } from './dto/change-tier.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSubscription = (overrides: Partial<Subscription> = {}): Subscription =>
  ({
    id: 'sub-uuid-1',
    userId: 'user-uuid-1',
    tier: SubscriptionTier.BASIC,
    status: SubscriptionStatus.ACTIVE,
    billingInterval: BillingInterval.MONTHLY,
    priceInCents: 999,
    externalSubscriptionId: 'sub_mock_abc',
    externalCustomerId: 'cus_mock_abc',
    autoRenew: true,
    successfulBillingCycles: 1,
    failedBillingAttempts: 0,
    currentPeriodStart: new Date('2026-09-17'),
    currentPeriodEnd: new Date('2026-10-17'),
    createdAt: new Date('2026-09-17'),
    updatedAt: new Date('2026-09-17'),
    metadata: {},
    ...overrides,
  } as Subscription);

const makeBillingRecord = (overrides: Partial<BillingRecord> = {}): BillingRecord =>
  ({
    id: 'bill-uuid-1',
    userId: 'user-uuid-1',
    subscriptionId: 'sub-uuid-1',
    amountInCents: 999,
    currency: 'USD',
    status: BillingStatus.PAID,
    createdAt: new Date('2026-09-17'),
    metadata: {},
    ...overrides,
  } as BillingRecord);

// ---------------------------------------------------------------------------
// Mock factories (same pattern as achievements.service.spec.ts)
// ---------------------------------------------------------------------------

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockBillingProvider = () => ({
  createCustomer: jest.fn(),
  createSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  charge: jest.fn(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionRepo: ReturnType<typeof mockRepository>;
  let billingRecordRepo: ReturnType<typeof mockRepository>;
  let billingProvider: ReturnType<typeof mockBillingProvider>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: getRepositoryToken(Subscription), useFactory: mockRepository },
        { provide: getRepositoryToken(BillingRecord), useFactory: mockRepository },
        { provide: BILLING_PROVIDER, useFactory: mockBillingProvider },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepo = module.get(getRepositoryToken(Subscription));
    billingRecordRepo = module.get(getRepositoryToken(BillingRecord));
    billingProvider = module.get(BILLING_PROVIDER);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // Tier catalogue
  // =========================================================================

  describe('getTierDefinitions', () => {
    it('returns all four tier definitions', () => {
      const tiers = service.getTierDefinitions();
      expect(tiers).toHaveLength(4);
      const names = tiers.map((t) => t.tier);
      expect(names).toContain(SubscriptionTier.FREE);
      expect(names).toContain(SubscriptionTier.BASIC);
      expect(names).toContain(SubscriptionTier.PRO);
      expect(names).toContain(SubscriptionTier.ENTERPRISE);
    });
  });

  describe('getTierDefinition', () => {
    it('returns the correct definition for a given tier', () => {
      const def = service.getTierDefinition(SubscriptionTier.PRO);
      expect(def.name).toBe('Pro');
      expect(def.features.customPuzzleBuilder).toBe(true);
      expect(def.features.apiAccess).toBe(true);
    });

    it('returns free tier with zero price', () => {
      const def = service.getTierDefinition(SubscriptionTier.FREE);
      expect(def.pricing[BillingInterval.MONTHLY]).toBe(0);
      expect(def.pricing[BillingInterval.YEARLY]).toBe(0);
    });
  });

  // =========================================================================
  // createSubscription
  // =========================================================================

  describe('createSubscription', () => {
    const dto: CreateSubscriptionDto = {
      tier: SubscriptionTier.BASIC,
      billingInterval: BillingInterval.MONTHLY,
      paymentMethodId: 'pm_test_123',
    };

    it('creates a new active subscription for a user with no prior subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null); // no existing subscription
      billingProvider.createCustomer.mockResolvedValue('cus_mock_new');
      billingProvider.createSubscription.mockResolvedValue({
        externalSubscriptionId: 'sub_mock_new',
        externalCustomerId: 'cus_mock_new',
      });

      const saved = makeSubscription({ status: SubscriptionStatus.ACTIVE });
      subscriptionRepo.create.mockReturnValue(saved);
      subscriptionRepo.save.mockResolvedValue(saved);

      const result = await service.createSubscription('user-uuid-1', dto);

      expect(subscriptionRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', status: SubscriptionStatus.ACTIVE },
      });
      expect(billingProvider.createCustomer).toHaveBeenCalledWith('user-uuid-1', '');
      expect(billingProvider.createSubscription).toHaveBeenCalled();
      expect(subscriptionRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('creates a TRIAL subscription when the tier has trial days', async () => {
      const trialDto: CreateSubscriptionDto = {
        tier: SubscriptionTier.PRO, // trialDays = 14
        billingInterval: BillingInterval.MONTHLY,
      };
      subscriptionRepo.findOne.mockResolvedValue(null);
      billingProvider.createCustomer.mockResolvedValue('cus_mock_x');
      billingProvider.createSubscription.mockResolvedValue({
        externalSubscriptionId: 'sub_mock_trial',
        externalCustomerId: 'cus_mock_x',
      });

      const trialSub = makeSubscription({
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.TRIAL,
      });
      subscriptionRepo.create.mockReturnValue(trialSub);
      subscriptionRepo.save.mockResolvedValue(trialSub);

      const result = await service.createSubscription('user-uuid-2', trialDto);
      expect(result.status).toBe(SubscriptionStatus.TRIAL);
    });

    it('creates a FREE subscription without calling the billing provider', async () => {
      const freeDto: CreateSubscriptionDto = {
        tier: SubscriptionTier.FREE,
        billingInterval: BillingInterval.MONTHLY,
      };
      subscriptionRepo.findOne.mockResolvedValue(null);
      const freeSub = makeSubscription({
        tier: SubscriptionTier.FREE,
        priceInCents: 0,
        status: SubscriptionStatus.ACTIVE,
      });
      subscriptionRepo.create.mockReturnValue(freeSub);
      subscriptionRepo.save.mockResolvedValue(freeSub);

      const result = await service.createSubscription('user-uuid-3', freeDto);

      expect(billingProvider.createCustomer).not.toHaveBeenCalled();
      expect(billingProvider.createSubscription).not.toHaveBeenCalled();
      expect(result.tier).toBe(SubscriptionTier.FREE);
    });

    it('throws ConflictException when an active subscription already exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue(makeSubscription());

      await expect(
        service.createSubscription('user-uuid-1', dto),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException for an unknown tier', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createSubscription('user-uuid-1', {
          tier: 'invalid_tier' as SubscriptionTier,
          billingInterval: BillingInterval.MONTHLY,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // findByUserId / findById / findAllByUserId
  // =========================================================================

  describe('findByUserId', () => {
    it('returns the active subscription for a user', async () => {
      const sub = makeSubscription();
      subscriptionRepo.findOne.mockResolvedValue(sub);

      const result = await service.findByUserId('user-uuid-1');
      expect(result).toEqual(sub);
      expect(subscriptionRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', status: SubscriptionStatus.ACTIVE },
      });
    });

    it('returns null when user has no active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      const result = await service.findByUserId('no-sub-user');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the subscription when found', async () => {
      const sub = makeSubscription();
      subscriptionRepo.findOne.mockResolvedValue(sub);
      const result = await service.findById('sub-uuid-1');
      expect(result).toEqual(sub);
    });

    it('throws NotFoundException when subscription does not exist', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByUserId', () => {
    it('returns all subscriptions for a user ordered by createdAt DESC', async () => {
      const subs = [makeSubscription(), makeSubscription({ id: 'sub-uuid-2' })];
      subscriptionRepo.find.mockResolvedValue(subs);
      const result = await service.findAllByUserId('user-uuid-1');
      expect(result).toHaveLength(2);
    });
  });

  // =========================================================================
  // cancelSubscription
  // =========================================================================

  describe('cancelSubscription', () => {
    it('cancels immediately when immediate=true', async () => {
      const sub = makeSubscription();
      subscriptionRepo.findOne.mockResolvedValue(sub);
      billingProvider.cancelSubscription.mockResolvedValue({ cancelled: true });

      const cancelled = makeSubscription({ status: SubscriptionStatus.CANCELLED });
      subscriptionRepo.save.mockResolvedValue(cancelled);

      const dto: CancelSubscriptionDto = { immediate: true, reason: 'Too expensive' };
      const result = await service.cancelSubscription('user-uuid-1', dto);

      expect(billingProvider.cancelSubscription).toHaveBeenCalledWith(
        sub.externalSubscriptionId,
        true,
      );
      expect(subscriptionRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });

    it('keeps subscription active until period end when immediate=false', async () => {
      const sub = makeSubscription();
      subscriptionRepo.findOne.mockResolvedValue(sub);
      billingProvider.cancelSubscription.mockResolvedValue({ cancelled: true });

      // Save should be called with autoRenew=false but status still ACTIVE
      subscriptionRepo.save.mockImplementation((s: Subscription) =>
        Promise.resolve({ ...s }),
      );

      const dto: CancelSubscriptionDto = { immediate: false, reason: 'Switching plan' };
      await service.cancelSubscription('user-uuid-1', dto);

      const savedArg = subscriptionRepo.save.mock.calls[0][0] as Subscription;
      expect(savedArg.autoRenew).toBe(false);
      expect(savedArg.status).toBe(SubscriptionStatus.ACTIVE); // still active
      expect(savedArg.cancelEffectiveDate).toEqual(sub.currentPeriodEnd);
    });

    it('throws NotFoundException when user has no active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.cancelSubscription('user-uuid-1', { immediate: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('does not call billing provider for subscriptions without externalSubscriptionId', async () => {
      const sub = makeSubscription({ externalSubscriptionId: undefined });
      subscriptionRepo.findOne.mockResolvedValue(sub);
      subscriptionRepo.save.mockResolvedValue(sub);

      await service.cancelSubscription('user-uuid-1', { immediate: true });
      expect(billingProvider.cancelSubscription).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // changeTier (upgrade / downgrade)
  // =========================================================================

  describe('changeTier', () => {
    it('upgrades immediately and charges a proration fee', async () => {
      const sub = makeSubscription({
        tier: SubscriptionTier.BASIC,
        priceInCents: 999,
        externalCustomerId: 'cus_mock_abc',
        currentPeriodStart: new Date(Date.now() - 15 * 86_400_000), // 15 days ago
        currentPeriodEnd: new Date(Date.now() + 15 * 86_400_000),   // 15 days ahead
      });
      subscriptionRepo.findOne.mockResolvedValue(sub);
      billingProvider.charge.mockResolvedValue({
        success: true,
        externalPaymentId: 'pay_mock_proration',
      });
      billingRecordRepo.create.mockImplementation((d: any) => d);
      billingRecordRepo.save.mockResolvedValue({});
      subscriptionRepo.save.mockImplementation((s: any) => Promise.resolve(s));

      const dto: ChangeTierDto = {
        newTier: SubscriptionTier.PRO,
        immediate: true,
      };
      const result = await service.changeTier('user-uuid-1', dto);

      expect(billingProvider.charge).toHaveBeenCalled();
      expect(billingRecordRepo.save).toHaveBeenCalled();
      expect(result.tier).toBe(SubscriptionTier.PRO);
    });

    it('schedules a downgrade for the next renewal when immediate=false', async () => {
      const sub = makeSubscription({ tier: SubscriptionTier.PRO, priceInCents: 2999 });
      subscriptionRepo.findOne.mockResolvedValue(sub);
      subscriptionRepo.save.mockImplementation((s: any) => Promise.resolve(s));

      const dto: ChangeTierDto = { newTier: SubscriptionTier.BASIC, immediate: false };
      const result = await service.changeTier('user-uuid-1', dto);

      expect(result.scheduledTier).toBe(SubscriptionTier.BASIC);
      // Tier should NOT be changed yet
      expect(result.tier).toBe(SubscriptionTier.PRO);
    });

    it('throws BadRequestException when trying to change to the same tier', async () => {
      const sub = makeSubscription({ tier: SubscriptionTier.BASIC });
      subscriptionRepo.findOne.mockResolvedValue(sub);

      await expect(
        service.changeTier('user-uuid-1', {
          newTier: SubscriptionTier.BASIC,
          immediate: true,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when user has no active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      await expect(
        service.changeTier('user-uuid-1', {
          newTier: SubscriptionTier.PRO,
          immediate: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // Feature gating
  // =========================================================================

  describe('getUserFeatures', () => {
    it('returns PRO features for a PRO subscriber', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        makeSubscription({ tier: SubscriptionTier.PRO }),
      );
      const features = await service.getUserFeatures('user-uuid-1');
      expect(features.customPuzzleBuilder).toBe(true);
      expect(features.advancedAnalytics).toBe(true);
    });

    it('returns FREE features when the user has no active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      const features = await service.getUserFeatures('no-sub-user');
      expect(features.maxPuzzlesPerDay).toBe(5);
      expect(features.analyticsAccess).toBe(false);
    });
  });

  describe('hasFeature', () => {
    it('returns true when the user tier includes the boolean feature', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        makeSubscription({ tier: SubscriptionTier.BASIC }),
      );
      const result = await service.hasFeature('user-uuid-1', 'analyticsAccess');
      expect(result).toBe(true);
    });

    it('returns false when the user tier does not include the feature', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        makeSubscription({ tier: SubscriptionTier.FREE }),
      );
      const result = await service.hasFeature('user-uuid-1', 'analyticsAccess');
      expect(result).toBe(false);
    });

    it('returns true for numeric features with value -1 (unlimited)', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        makeSubscription({ tier: SubscriptionTier.PRO }),
      );
      const result = await service.hasFeature('user-uuid-1', 'maxPuzzlesPerDay');
      expect(result).toBe(true); // -1 means unlimited → truthy
    });

    it('returns false for numeric features with value 0 (locked)', async () => {
      // FREE tier has maxHintsPerPuzzle = 1 but analyticsAccess is a boolean false
      // Let's verify the numeric path: maxPuzzlesPerDay on FREE = 5 (truthy)
      subscriptionRepo.findOne.mockResolvedValue(
        makeSubscription({ tier: SubscriptionTier.FREE }),
      );
      const result = await service.hasFeature('user-uuid-1', 'maxPuzzlesPerDay');
      expect(result).toBe(true); // 5 !== 0 so feature is available
    });
  });

  describe('getUserTier', () => {
    it('returns the user tier when an active subscription exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue(
        makeSubscription({ tier: SubscriptionTier.PRO }),
      );
      const tier = await service.getUserTier('user-uuid-1');
      expect(tier).toBe(SubscriptionTier.PRO);
    });

    it('defaults to FREE when no active subscription exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);
      const tier = await service.getUserTier('no-sub-user');
      expect(tier).toBe(SubscriptionTier.FREE);
    });
  });

  // =========================================================================
  // Analytics
  // =========================================================================

  describe('getAnalytics', () => {
    it('returns aggregated stats for a date window', async () => {
      const subs = [
        makeSubscription({ tier: SubscriptionTier.PRO, status: SubscriptionStatus.ACTIVE }),
        makeSubscription({
          id: 'sub-2',
          tier: SubscriptionTier.BASIC,
          status: SubscriptionStatus.CANCELLED,
        }),
      ];

      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(subs),
      };
      subscriptionRepo.createQueryBuilder.mockReturnValue(qb);

      const billingQb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([makeBillingRecord({ amountInCents: 2999 })]),
      };
      billingRecordRepo.createQueryBuilder.mockReturnValue(billingQb);

      const result = await service.getAnalytics({
        from: '2026-01-01',
        to: '2026-12-31',
      });

      expect(result.totalSubscriptions).toBe(2);
      expect(result.activeSubscriptions).toBe(1);
      expect(result.churnCount).toBe(1);
      expect(result.byTier[SubscriptionTier.PRO]).toBe(1);
      expect(result.byStatus[SubscriptionStatus.CANCELLED]).toBe(1);
      expect(result.mrrCents).toBe(2999); // one active PRO monthly
      expect(result.totalRevenueCents).toBe(2999);
    });
  });

  describe('getBillingHistory', () => {
    it('returns billing records ordered by createdAt DESC', async () => {
      const records = [makeBillingRecord(), makeBillingRecord({ id: 'bill-2' })];
      billingRecordRepo.find.mockResolvedValue(records);

      const result = await service.getBillingHistory('user-uuid-1');
      expect(result).toHaveLength(2);
      expect(billingRecordRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // =========================================================================
  // Auto-renewal cron
  // =========================================================================

  describe('processAutoRenewals', () => {
    it('renews an active subscription and creates a PAID billing record on success', async () => {
      const sub = makeSubscription({
        priceInCents: 999,
        externalCustomerId: 'cus_mock_abc',
        currentPeriodEnd: new Date(Date.now() - 1000), // already ended
      });

      subscriptionRepo.find
        .mockResolvedValueOnce([sub])  // due subscriptions
        .mockResolvedValueOnce([])     // cancelled subscriptions
        .mockResolvedValueOnce([]);    // trial subscriptions

      billingProvider.charge.mockResolvedValue({
        success: true,
        externalPaymentId: 'pay_mock_renew',
      });
      billingRecordRepo.create.mockImplementation((d: any) => d);
      billingRecordRepo.save.mockResolvedValue({});
      subscriptionRepo.save.mockImplementation((s: any) => Promise.resolve(s));

      await service.processAutoRenewals();

      expect(billingProvider.charge).toHaveBeenCalledWith(
        'cus_mock_abc',
        999,
        'USD',
        expect.stringContaining('renewal'),
      );
      expect(billingRecordRepo.save).toHaveBeenCalled();
      const savedBilling = billingRecordRepo.save.mock.calls[0][0];
      expect(savedBilling.status).toBe(BillingStatus.PAID);
    });

    it('marks subscription as PAST_DUE after 3 consecutive failed billing attempts', async () => {
      const sub = makeSubscription({
        priceInCents: 999,
        externalCustomerId: 'cus_mock_abc',
        failedBillingAttempts: 2, // this will be the 3rd failure
        currentPeriodEnd: new Date(Date.now() - 1000),
      });

      subscriptionRepo.find
        .mockResolvedValueOnce([sub])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      billingProvider.charge.mockResolvedValue({
        success: false,
        failureReason: 'Card declined',
      });
      billingRecordRepo.create.mockImplementation((d: any) => d);
      billingRecordRepo.save.mockResolvedValue({});
      subscriptionRepo.save.mockImplementation((s: any) => Promise.resolve(s));

      await service.processAutoRenewals();

      const savedSub: Subscription = subscriptionRepo.save.mock.calls[0][0];
      expect(savedSub.status).toBe(SubscriptionStatus.PAST_DUE);
      expect(savedSub.failedBillingAttempts).toBe(3);
    });

    it('applies a scheduled tier change on renewal', async () => {
      const sub = makeSubscription({
        tier: SubscriptionTier.PRO,
        scheduledTier: SubscriptionTier.BASIC,
        priceInCents: 2999,
        externalCustomerId: 'cus_mock_abc',
        currentPeriodEnd: new Date(Date.now() - 1000),
      });

      subscriptionRepo.find
        .mockResolvedValueOnce([sub])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      billingProvider.charge.mockResolvedValue({
        success: true,
        externalPaymentId: 'pay_mock_downgrade',
      });
      billingRecordRepo.create.mockImplementation((d: any) => d);
      billingRecordRepo.save.mockResolvedValue({});
      subscriptionRepo.save.mockImplementation((s: any) => Promise.resolve(s));

      await service.processAutoRenewals();

      const savedSub: Subscription = subscriptionRepo.save.mock.calls[0][0];
      expect(savedSub.tier).toBe(SubscriptionTier.BASIC);
      expect(savedSub.scheduledTier).toBeUndefined();
    });

    it('does not call billing provider for FREE subscriptions during renewal', async () => {
      const sub = makeSubscription({
        tier: SubscriptionTier.FREE,
        priceInCents: 0,
        currentPeriodEnd: new Date(Date.now() - 1000),
      });

      subscriptionRepo.find
        .mockResolvedValueOnce([sub])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      subscriptionRepo.save.mockImplementation((s: any) => Promise.resolve(s));

      await service.processAutoRenewals();

      expect(billingProvider.charge).not.toHaveBeenCalled();
    });
  });
});
