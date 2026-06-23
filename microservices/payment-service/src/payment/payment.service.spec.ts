import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Payment } from '../entities/payment.entity';
import { StripePaymentProvider } from '../providers/stripe.provider';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockPaymentRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let mockStripeProvider: {
    processPayment: jest.Mock;
    refundPayment: jest.Mock;
  };

  beforeEach(async () => {
    mockPaymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockStripeProvider = {
      processPayment: jest.fn(),
      refundPayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: StripePaymentProvider,
          useValue: mockStripeProvider,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('processPayment', () => {
    it('creates and completes a payment successfully', async () => {
      const dto = {
        userId: 'user-1',
        amount: 29.99,
        currency: 'usd',
        description: 'Premium purchase',
      };

      const pendingPayment = {
        id: 'pay-1',
        ...dto,
        status: 'processing',
        provider: 'stripe',
      };

      mockPaymentRepository.create.mockReturnValue(pendingPayment);
      mockPaymentRepository.save.mockImplementation((payment) =>
        Promise.resolve(payment),
      );
      mockStripeProvider.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'txn_123',
      });

      const result = await service.processPayment('stripe', dto);

      expect(result.status).toBe('completed');
      expect(result.externalTransactionId).toBe('txn_123');
    });

    it('marks payment as failed when provider fails', async () => {
      const dto = {
        userId: 'user-1',
        amount: 10,
        currency: 'usd',
      };

      mockPaymentRepository.create.mockReturnValue({
        id: 'pay-2',
        status: 'processing',
      });
      mockPaymentRepository.save.mockImplementation((payment) =>
        Promise.resolve(payment),
      );
      mockStripeProvider.processPayment.mockResolvedValue({
        success: false,
        error: 'Card declined',
      });

      const result = await service.processPayment('stripe', dto);
      expect(result.status).toBe('failed');
    });

    it('throws for unknown provider', async () => {
      await expect(
        service.processPayment('unknown', {
          userId: 'user-1',
          amount: 10,
          currency: 'usd',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refundPayment', () => {
    it('processes refund for existing payment', async () => {
      const payment = {
        id: 'pay-1',
        status: 'completed',
        externalTransactionId: 'txn_123',
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);
      mockPaymentRepository.save.mockImplementation((p) => Promise.resolve(p));
      mockStripeProvider.refundPayment.mockResolvedValue({
        success: true,
        refundId: 'ref_123',
      });

      const result = await service.refundPayment('stripe', {
        transactionId: 'txn_123',
      });

      expect(result.status).toBe('refunded');
      expect(result.refundId).toBe('ref_123');
    });

    it('throws when payment not found', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refundPayment('stripe', { transactionId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
