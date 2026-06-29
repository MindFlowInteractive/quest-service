import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WebhooksService } from './webhooks.service';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WebhookUrlValidatorService } from './webhook-url-validator.service';
import { WEBHOOK_QUEUE } from './webhook.constants';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let webhookRepository: any;
  let deliveryRepository: any;
  let validator: any;

  beforeEach(async () => {
    webhookRepository = {
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockImplementation(async (value) => ({
        id: 'webhook-1',
        createdAt: new Date('2026-03-27T00:00:00.000Z'),
        updatedAt: new Date('2026-03-27T00:00:00.000Z'),
        active: true,
        ...value,
      })),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    deliveryRepository = {
      find: jest.fn().mockResolvedValue([{ id: 'delivery-1', webhookId: 'webhook-1', status: 'success' }]),
      createQueryBuilder: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((value) => value),
    };

    validator = { validate: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: getRepositoryToken(Webhook), useValue: webhookRepository },
        { provide: getRepositoryToken(WebhookDelivery), useValue: deliveryRepository },
        { provide: getQueueToken(WEBHOOK_QUEUE), useValue: { add: jest.fn() } },
        { provide: WebhookUrlValidatorService, useValue: validator },
        { provide: ConfigService, useValue: { get: jest.fn().mockImplementation((key: string, fallback: unknown) => fallback) } },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('registers a webhook for the authenticated user', async () => {
    webhookRepository.findOne.mockResolvedValue({
      id: 'webhook-1',
      url: 'https://example.com/hook',
      events: ['puzzle.solved'],
      active: true,
      userId: 'user-1',
      appId: 'mesh',
      createdAt: new Date('2026-03-27T00:00:00.000Z'),
      updatedAt: new Date('2026-03-27T00:00:00.000Z'),
    });

    const webhook = await service.create('user-1', {
      url: 'https://example.com/hook',
      secret: 'secret',
      events: ['puzzle.solved'],
      appId: 'mesh',
    });

    expect(validator.validate).toHaveBeenCalledWith('https://example.com/hook');
    expect(webhookRepository.create).toHaveBeenCalledWith({
      url: 'https://example.com/hook',
      secret: 'secret',
      events: ['puzzle.solved'],
      appId: 'mesh',
      userId: 'user-1',
      active: true,
    });
    expect(webhook.userId).toBe('user-1');
  });

  it('returns delivery logs for the owning user', async () => {
    webhookRepository.findOne.mockResolvedValue({ id: 'webhook-1', userId: 'user-1' });

    const deliveries = await service.getDeliveries('user-1', 'webhook-1');

    expect(webhookRepository.findOne).toHaveBeenCalledWith({ where: { id: 'webhook-1', userId: 'user-1' } });
    expect(deliveryRepository.find).toHaveBeenCalledWith({
      where: { webhookId: 'webhook-1' },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    expect(deliveries).toHaveLength(1);
  });
});