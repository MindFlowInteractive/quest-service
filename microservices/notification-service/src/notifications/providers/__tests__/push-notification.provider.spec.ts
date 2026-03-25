import { PushNotificationProvider } from '../push-notification.provider';
import { ConfigService } from '@nestjs/config';

const mockSend = jest.fn();
const mockSendEachForMulticast = jest.fn();
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: { cert: jest.fn(() => 'mock-credential') },
  messaging: jest.fn(() => ({
    send: mockSend,
    sendEachForMulticast: mockSendEachForMulticast,
  })),
}));

describe('PushNotificationProvider', () => {
  let provider: PushNotificationProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    const configService = { get: jest.fn((key: string) => undefined) } as any;
    provider = new PushNotificationProvider(configService);
  });

  describe('sendToTokens', () => {
    it('should send multicast to multiple tokens', async () => {
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [{ success: true }, { success: true }],
      });

      const result = await provider.sendToTokens(
        ['token-1', 'token-2'],
        { title: 'Test', body: 'Hello' },
      );

      expect(result.successCount).toBe(2);
      expect(result.staleTokens).toHaveLength(0);
      expect(mockSendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({ tokens: ['token-1', 'token-2'] }),
      );
    });

    it('should detect and return stale tokens', async () => {
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 1,
        responses: [
          { success: true },
          { success: false, error: { code: 'messaging/registration-token-not-registered' } },
        ],
      });

      const result = await provider.sendToTokens(
        ['good-token', 'stale-token'],
        { title: 'Test', body: 'Hello' },
      );

      expect(result.successCount).toBe(1);
      expect(result.staleTokens).toEqual(['stale-token']);
    });

    it('should detect invalid registration tokens', async () => {
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 0,
        failureCount: 1,
        responses: [
          { success: false, error: { code: 'messaging/invalid-registration-token' } },
        ],
      });

      const result = await provider.sendToTokens(
        ['bad-token'],
        { title: 'Test', body: 'Hello' },
      );

      expect(result.staleTokens).toEqual(['bad-token']);
    });
  });

  describe('sendBroadcast', () => {
    it('should chunk tokens into batches of 500', async () => {
      const tokens = Array.from({ length: 1200 }, (_, i) => `token-${i}`);
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 500,
        failureCount: 0,
        responses: Array(500).fill({ success: true }),
      });

      const result = await provider.sendBroadcast(tokens, { title: 'Broadcast', body: 'Hello all' });

      expect(mockSendEachForMulticast).toHaveBeenCalledTimes(3);
      expect(result.staleTokens).toHaveLength(0);
    });

    it('should aggregate stale tokens across batches', async () => {
      const tokens = Array.from({ length: 600 }, (_, i) => `token-${i}`);

      mockSendEachForMulticast.mockResolvedValueOnce({
        successCount: 499,
        failureCount: 1,
        responses: [
          ...Array(499).fill({ success: true }),
          { success: false, error: { code: 'messaging/registration-token-not-registered' } },
        ],
      });
      mockSendEachForMulticast.mockResolvedValueOnce({
        successCount: 100,
        failureCount: 0,
        responses: Array(100).fill({ success: true }),
      });

      const result = await provider.sendBroadcast(tokens, { title: 'Test', body: 'Hi' });
      expect(result.staleTokens).toHaveLength(1);
      expect(result.staleTokens[0]).toBe('token-499');
    });

    it('should handle empty token list', async () => {
      const result = await provider.sendBroadcast([], { title: 'Test', body: 'Hi' });
      expect(mockSendEachForMulticast).not.toHaveBeenCalled();
      expect(result.successCount).toBe(0);
    });
  });
});
