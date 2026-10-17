import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { SubscriptionTierGuard } from './subscription-tier.guard';
import { SubscriptionsService } from '../subscriptions.service';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIER_KEY,
} from '../enums/subscription.enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeContext = (userId: string | undefined): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: userId ? { id: userId } : undefined,
      }),
    }),
  } as unknown as ExecutionContext);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SubscriptionTierGuard', () => {
  let guard: SubscriptionTierGuard;
  let reflector: Reflector;
  let subscriptionsService: { getUserTier: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionTierGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: SubscriptionsService,
          useValue: { getUserTier: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<SubscriptionTierGuard>(SubscriptionTierGuard);
    reflector = module.get<Reflector>(Reflector);
    subscriptionsService = module.get(SubscriptionsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('allows access when no tier requirement is set on the route', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const ctx = makeContext('user-1');
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(subscriptionsService.getUserTier).not.toHaveBeenCalled();
  });

  it('allows access when the user tier meets the required tier', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(SubscriptionTier.BASIC);
    subscriptionsService.getUserTier.mockResolvedValue(SubscriptionTier.BASIC);

    const result = await guard.canActivate(makeContext('user-1'));
    expect(result).toBe(true);
  });

  it('allows access when the user tier exceeds the required tier', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(SubscriptionTier.BASIC);
    subscriptionsService.getUserTier.mockResolvedValue(SubscriptionTier.PRO);

    const result = await guard.canActivate(makeContext('user-1'));
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when the user tier is below the required tier', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(SubscriptionTier.PRO);
    subscriptionsService.getUserTier.mockResolvedValue(SubscriptionTier.FREE);

    await expect(guard.canActivate(makeContext('user-1'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException with a descriptive message about the required tier', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(SubscriptionTier.ENTERPRISE);
    subscriptionsService.getUserTier.mockResolvedValue(SubscriptionTier.PRO);

    try {
      await guard.canActivate(makeContext('user-1'));
      fail('should have thrown');
    } catch (e: any) {
      expect(e.message).toContain(SubscriptionTier.ENTERPRISE);
    }
  });

  it('throws ForbiddenException when the request has no authenticated user', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(SubscriptionTier.BASIC);

    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('reads metadata from both the handler and class via getAllAndOverride', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(SubscriptionTier.BASIC);
    subscriptionsService.getUserTier.mockResolvedValue(SubscriptionTier.BASIC);

    const ctx = makeContext('user-1');
    await guard.canActivate(ctx);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      SUBSCRIPTION_TIER_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
  });
});
