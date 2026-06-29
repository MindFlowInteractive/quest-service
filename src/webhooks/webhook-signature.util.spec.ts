import { createWebhookSignature } from './webhook-signature.util';

describe('createWebhookSignature', () => {
  it('generates an HMAC-SHA256 signature with the sha256 prefix', () => {
    const signature = createWebhookSignature('{"hello":"world"}', 'top-secret');

    expect(signature).toBe('sha256=afd00617ceb8f63e65ea5c310f06bf78c3901e7a713db532e25da26ad63c7236');
  });
});