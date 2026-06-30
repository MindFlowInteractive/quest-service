import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import {
  SmsPayload,
  SmsProvider,
  SmsSendResult,
} from './interfaces/sms-provider.interface';

@Injectable()
export class SnsProvider implements SmsProvider {
  name = 'sns';

  constructor(private readonly configService: ConfigService) {}

  validateConfig(): boolean {
    return Boolean(
      this.configService.get<string>('sms.sns.region') &&
        this.configService.get<string>('sms.sns.accessKeyId') &&
        this.configService.get<string>('sms.sns.secretAccessKey'),
    );
  }

  async send(payload: SmsPayload): Promise<SmsSendResult> {
    if (!this.validateConfig()) {
      return {
        success: false,
        provider: this.name,
        error: 'AWS SNS credentials are not configured',
      };
    }

    try {
      const client = new SNSClient({
        region: this.configService.get<string>('sms.sns.region'),
        credentials: {
          accessKeyId: this.configService.get<string>('sms.sns.accessKeyId') || '',
          secretAccessKey:
            this.configService.get<string>('sms.sns.secretAccessKey') || '',
        },
      });

      const response = await client.send(
        new PublishCommand({
          PhoneNumber: payload.to,
          Message: payload.body,
          MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
              DataType: 'String',
              StringValue:
                payload.from || this.configService.get<string>('sms.sns.senderId', 'Quest'),
            },
          },
        }),
      );

      return {
        success: true,
        provider: this.name,
        messageId: response.MessageId,
        segments: Math.max(1, Math.ceil(payload.body.length / 160)),
        deliveryStatus: 'sent',
        rawResponse: {
          messageId: response.MessageId,
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
