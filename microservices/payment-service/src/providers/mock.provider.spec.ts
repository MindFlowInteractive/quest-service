import { MockPaymentProvider } from './mock.provider';

describe('MockPaymentProvider', () => {
  let provider: MockPaymentProvider;

  beforeEach(() => {
    provider = new MockPaymentProvider();
  });

  it('processes valid payments', async () => {
    const result = await provider.processPayment({
      amount: 50,
      currency: 'usd',
      userId: 'user-1',
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toMatch(/^mock_/);
  });

  it('rejects invalid amounts', async () => {
    const result = await provider.processPayment({
      amount: 0,
      currency: 'usd',
      userId: 'user-1',
    });

    expect(result.success).toBe(false);
  });

  it('processes refunds', async () => {
    const result = await provider.refundPayment('txn_123', 25);

    expect(result.success).toBe(true);
    expect(result.refundId).toMatch(/^mock_refund_/);
  });
});
