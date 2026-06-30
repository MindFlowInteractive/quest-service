import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import {
  SmsPayload,
  SmsProvider,
  SmsSendResult,
} from './interfaces/sms-provider.interface';

@Injectable()
export class TwilioProvider implements SmsProvider {
  name = 'twilio';

  constructor(private readonly configService: ConfigService) {}

  validateConfig(): boolean {
    return Boolean(
      this.configService.get<string>('sms.twilio.accountSid') &&
        this.configService.get<string>('sms.twilio.authToken') &&
        (this.configService.get<string>('sms.twilio.fromNumber') ||
          this.configService.get<string>('sms.twilio.messagingServiceSid')),
    );
  }

  async send(payload: SmsPayload): Promise<SmsSendResult> {
    if (!this.validateConfig()) {
      return {
        success: false,
        provider: this.name,
        error: 'Twilio credentials are not configured',
      };
    }

    try {
      const client = Twilio(
        this.configService.get<string>('sms.twilio.accountSid'),
        this.configService.get<string>('sms.twilio.authToken'),
      );

      const response = await client.messages.create({
        to: payload.to,
        body: payload.body,
        from: this.configService.get<string>('sms.twilio.fromNumber') || undefined,
        messagingServiceSid:
          this.configService.get<string>('sms.twilio.messagingServiceSid') || undefined,
        statusCallback: payload.statusCallbackUrl,
      });

      return {
        success: true,
        provider: this.name,
        messageId: response.sid,
        segments: parseInt(response.numSegments || '1', 10),
        deliveryStatus: 'sent',
        rawResponse: {
          sid: response.sid,
          status: response.status,
        },
      };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error.message,
      };
    }
  }
}
