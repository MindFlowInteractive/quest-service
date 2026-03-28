import * as crypto from 'crypto';

export function createWebhookSignature(payload: string, secret: string): string {
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${digest}`;
}