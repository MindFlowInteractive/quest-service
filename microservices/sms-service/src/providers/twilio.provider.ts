import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SmsProvider,
  SmsProviderRequest,
  SmsProviderResponse,
} from './interfaces/sms-provider.interface';

@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';

  constructor(private readonly configService: ConfigService) {}

  async send(request: SmsProviderRequest): Promise<SmsProviderResponse> {
    const accountSid = this.configService.get<string>('sms.twilio.accountSid');
    const authToken = this.configService.get<string>('sms.twilio.authToken');
    const callbackUrl = this.configService.get<string>(
      'sms.twilio.statusCallbackUrl',
    );

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }

    const body = new URLSearchParams({
      To: request.to,
      From: request.from,
      Body: request.body,
    });

    if (callbackUrl) {
      body.set('StatusCallback', callbackUrl);
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || 'Twilio SMS send failed');
    }

    return {
      provider: this.name,
      messageId: payload.sid,
      status: payload.status === 'queued' ? 'queued' : 'sent',
    };
  }
}
