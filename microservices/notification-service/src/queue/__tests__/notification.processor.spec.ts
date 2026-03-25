import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessor } from '../notification.processor';
import { NotificationGateway } from '../../common/gateways/notification.gateway';
import { PushNotificationProvider } from '../../notifications/providers/push-notification.provider';
import { RabbitMQService } from '@quest-service/shared';

jest.mock('@quest-service/shared', () => ({
  RabbitMQService: class RabbitMQService {},
}));

describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let mockPushProvider: any;
  let mockGateway: any;
  let mockRabbitMQ: any;

  beforeEach(async () => {
    mockPushProvider = {
      sendToTokens: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, staleTokens: [] }),
      sendBroadcast: jest.fn().mockResolvedValue({ successCount: 5, failureCount: 0, staleTokens: [] }),
    };
    mockGateway = { sendToUser: jest.fn().mockReturnValue(true) };
    mockRabbitMQ = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessor,
        { provide: NotificationGateway, useValue: mockGateway },
        { provide: PushNotificationProvider, useValue: mockPushProvider },
        { provide: RabbitMQService, useValue: mockRabbitMQ },
      ],
    }).compile();

    processor = module.get<NotificationProcessor>(NotificationProcessor);
  });

  it('should send push via tokens for single user', async () => {
    const job = {
      data: {
        userId: 'user-1',
        tokens: ['token-1', 'token-2'],
        content: { subject: 'Test', body: 'Hello' },
        channels: ['push'],
        type: 'achievement',
      },
    } as any;

    await processor.process(job);

    expect(mockPushProvider.sendToTokens).toHaveBeenCalledWith(
      ['token-1', 'token-2'],
      expect.objectContaining({ title: 'Test', body: 'Hello' }),
    );
  });

  it('should use sendBroadcast for broadcast type', async () => {
    const job = {
      data: {
        type: 'broadcast',
        tokens: ['tok-1', 'tok-2', 'tok-3'],
        content: { subject: 'Weekly', body: 'New challenge!' },
        channels: ['push'],
      },
    } as any;

    await processor.process(job);

    expect(mockPushProvider.sendBroadcast).toHaveBeenCalledWith(
      ['tok-1', 'tok-2', 'tok-3'],
      expect.objectContaining({ title: 'Weekly', body: 'New challenge!' }),
    );
  });

  it('should publish stale tokens to RabbitMQ when detected', async () => {
    mockPushProvider.sendToTokens.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      staleTokens: ['dead-token'],
    });

    const job = {
      data: {
        userId: 'user-1',
        tokens: ['good-token', 'dead-token'],
        content: { subject: 'Test', body: 'Hello' },
        channels: ['push'],
        type: 'achievement',
      },
    } as any;

    await processor.process(job);

    expect(mockRabbitMQ.publish).toHaveBeenCalledWith(
      '',
      'notification_stale_tokens_queue',
      { tokens: ['dead-token'] },
    );
  });

  it('should not publish stale tokens when none detected', async () => {
    const job = {
      data: {
        userId: 'user-1',
        tokens: ['good-token'],
        content: { subject: 'Test', body: 'Hello' },
        channels: ['push'],
        type: 'achievement',
      },
    } as any;

    await processor.process(job);

    expect(mockRabbitMQ.publish).not.toHaveBeenCalled();
  });
});
