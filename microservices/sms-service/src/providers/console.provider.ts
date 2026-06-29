import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  SmsPayload,
  SmsProvider,
  SmsSendResult,
} from './interfaces/sms-provider.interface';

@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  validateConfig(): boolean {
    return true;
  }

  async send(request: SmsPayload): Promise<SmsSendResult> {
    const messageId = `console_${randomUUID()}`;
    this.logger.log(`SMS ${messageId} to ${request.to}: ${request.body}`);

    return {
      success: true,
      provider: this.name,
      messageId,
      deliveryStatus: 'sent',
      segments: Math.max(1, Math.ceil(request.body.length / 160)),
    };
  }
}
