import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethod } from '../entities/payment-method.entity';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let mockRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodService,
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentMethodService>(PaymentMethodService);
  });

  it('creates a payment method', async () => {
    const dto = {
      userId: 'user-1',
      externalMethodId: 'pm_123',
      type: 'card' as const,
      last4: '4242',
      brand: 'visa',
    };

    mockRepository.create.mockImplementation((data) => data);
    mockRepository.save.mockImplementation((method) =>
      Promise.resolve({ id: 'pm-1', ...method }),
    );

    const result = await service.createPaymentMethod(dto);

    expect(result.externalMethodId).toBe('pm_123');
    expect(result.last4).toBe('4242');
  });

  it('sets default payment method and clears previous default', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: 'pm-1',
      userId: 'user-1',
      isDefault: false,
    });
    mockRepository.update.mockResolvedValue(undefined);
    mockRepository.save.mockImplementation((method) => Promise.resolve(method));

    const result = await service.setDefault('pm-1', 'user-1');

    expect(mockRepository.update).toHaveBeenCalled();
    expect(result.isDefault).toBe(true);
  });
});
