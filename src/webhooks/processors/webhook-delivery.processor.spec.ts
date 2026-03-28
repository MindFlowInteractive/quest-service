import axios from 'axios';
import { WebhookDeliveryProcessor } from './webhook-delivery.processor';

jest.mock('axios');

describe('WebhookDeliveryProcessor', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  it('marks a delivery for retry on a transient failure', async () => {
    const deliveryRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'delivery-1',
        event: 'puzzle.solved',
        payload: { puzzleId: 'puzzle-1' },
        signature: 'sha256=abc',
        createdAt: new Date('2026-03-27T00:00:00.000Z'),
        webhook: { url: 'https://example.com/hook' },
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const processor = new WebhookDeliveryProcessor(deliveryRepository as any);

    mockedAxios.post.mockRejectedValueOnce({
      message: 'timeout',
      response: { status: 503, data: { error: 'unavailable' } },
    });

    await expect(
      processor.process({ data: { deliveryId: 'delivery-1' }, attemptsMade: 0 } as any),
    ).rejects.toMatchObject({ message: 'timeout' });

    expect(deliveryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'retry',
        retryCount: 1,
        responseCode: 503,
        responseBody: JSON.stringify({ error: 'unavailable' }),
      }),
    );
  });

  it('marks a delivery as failed after the last retry', async () => {
    const deliveryRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'delivery-2',
        event: 'session.ended',
        payload: { sessionId: 'session-1' },
        signature: 'sha256=abc',
        createdAt: new Date('2026-03-27T00:00:00.000Z'),
        webhook: { url: 'https://example.com/hook' },
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const processor = new WebhookDeliveryProcessor(deliveryRepository as any);

    mockedAxios.post.mockRejectedValueOnce({
      message: 'permanent failure',
      response: { status: 500, data: 'boom' },
    });

    await expect(
      processor.process({ data: { deliveryId: 'delivery-2' }, attemptsMade: 3 } as any),
    ).rejects.toMatchObject({ message: 'permanent failure' });

    expect(deliveryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        retryCount: 3,
        responseCode: 500,
        responseBody: 'boom',
      }),
    );
  });
});