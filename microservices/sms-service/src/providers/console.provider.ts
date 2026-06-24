import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  SmsProvider,
  SmsProviderRequest,
  SmsProviderResponse,
} from './interfaces/sms-provider.interface';

@Injectable()
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  async send(request: SmsProviderRequest): Promise<SmsProviderResponse> {
    const messageId = `console_${randomUUID()}`;
    this.logger.log(`SMS ${messageId} to ${request.to}: ${request.body}`);

    return {
      provider: this.name,
      messageId,
      status: 'sent',
    };
  }
}
