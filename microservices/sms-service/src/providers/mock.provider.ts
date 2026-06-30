import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  SmsPayload,
  SmsProvider,
  SmsSendResult,
} from './interfaces/sms-provider.interface';

@Injectable()
export class MockProvider implements SmsProvider {
  name = 'mock';

  async send(payload: SmsPayload): Promise<SmsSendResult> {
    return {
      success: true,
      provider: this.name,
      messageId: randomUUID(),
      segments: Math.max(1, Math.ceil(payload.body.length / 160)),
      deliveryStatus: 'delivered',
      rawResponse: {
        acceptedAt: new Date().toISOString(),
        to: payload.to,
      },
    };
  }

  validateConfig(): boolean {
    return true;
  }
}
