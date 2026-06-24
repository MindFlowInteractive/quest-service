import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Invoice } from '../entities/invoice.entity';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockInvoiceRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    mockInvoiceRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepository,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  it('creates invoice with calculated total', async () => {
    const dto = {
      userId: 'user-1',
      currency: 'usd',
      lineItems: [
        { description: 'Premium', quantity: 1, unitPrice: 9.99, amount: 9.99 },
        { description: 'Tax', quantity: 1, unitPrice: 1.0, amount: 1.0 },
      ],
    };

    mockInvoiceRepository.create.mockImplementation((data) => data);
    mockInvoiceRepository.save.mockImplementation((invoice) =>
      Promise.resolve({ id: 'inv-1', ...invoice }),
    );

    const result = await service.createInvoice(dto);

    expect(result.amount).toBe(10.99);
    expect(result.status).toBe('draft');
    expect(result.invoiceNumber).toMatch(/^INV-/);
  });

  it('marks invoice as paid', async () => {
    const invoice = {
      id: 'inv-1',
      status: 'sent',
      paymentId: null,
    };

    mockInvoiceRepository.findOne.mockResolvedValue(invoice);
    mockInvoiceRepository.save.mockImplementation((inv) => Promise.resolve(inv));

    const result = await service.markAsPaid('inv-1', 'pay-1');

    expect(result.status).toBe('paid');
    expect(result.paymentId).toBe('pay-1');
    expect(result.paidAt).toBeDefined();
  });

  it('throws when invoice not found', async () => {
    mockInvoiceRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
