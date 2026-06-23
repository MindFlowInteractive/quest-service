import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Subscription } from '../entities/subscription.entity';
import { StripePaymentProvider } from '../providers/stripe.provider';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockSubscriptionRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let mockStripeProvider: {
    createSubscription: jest.Mock;
    cancelSubscription: jest.Mock;
  };

  beforeEach(async () => {
    mockSubscriptionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockStripeProvider = {
      createSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: StripePaymentProvider,
          useValue: mockStripeProvider,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('creates an active subscription', async () => {
    const dto = {
      userId: 'user-1',
      planId: 'premium',
      planName: 'Premium Plan',
      amount: 19.99,
      currency: 'usd',
      billingInterval: 'month' as const,
    };

    mockSubscriptionRepository.create.mockImplementation((data) => data);
    mockSubscriptionRepository.save.mockImplementation((sub) =>
      Promise.resolve({ id: 'sub-1', ...sub }),
    );
    mockStripeProvider.createSubscription.mockResolvedValue({
      success: true,
      subscriptionId: 'ext_sub_1',
    });

    const result = await service.createSubscription(dto);

    expect(result.status).toBe('active');
    expect(result.externalSubscriptionId).toBe('ext_sub_1');
  });

  it('cancels an active subscription', async () => {
    const subscription = {
      id: 'sub-1',
      status: 'active',
      externalSubscriptionId: 'ext_sub_1',
    };

    mockSubscriptionRepository.findOne.mockResolvedValue(subscription);
    mockSubscriptionRepository.save.mockImplementation((sub) =>
      Promise.resolve(sub),
    );
    mockStripeProvider.cancelSubscription.mockResolvedValue({ success: true });

    const result = await service.cancelSubscription('sub-1');

    expect(result.status).toBe('cancelled');
    expect(result.cancelledAt).toBeDefined();
  });

  it('throws when cancelling already cancelled subscription', async () => {
    mockSubscriptionRepository.findOne.mockResolvedValue({
      id: 'sub-1',
      status: 'cancelled',
    });

    await expect(service.cancelSubscription('sub-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
