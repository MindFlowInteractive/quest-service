import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  EmailProvider,
  EmailMessage,
  SendResult,
} from '../interfaces/email-provider.interface';

@Injectable()
export class SESProvider implements EmailProvider {
  private readonly logger = new Logger(SESProvider.name);
  private readonly client: SESClient;
  readonly name = 'ses';

  constructor(private readonly configService: ConfigService) {
    this.client = new SESClient({
      region: this.configService.get<string>('email.ses.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('email.ses.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('email.ses.secretAccessKey') || '',
      },
    });
  }

  validateConfig(): boolean {
    const accessKeyId = this.configService.get<string>('email.ses.accessKeyId');
    const secretAccessKey = this.configService.get<string>('email.ses.secretAccessKey');
    return !!accessKeyId && !!secretAccessKey;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    try {
      const fromAddress = message.fromName
        ? `${message.fromName} <${message.from}>`
        : message.from;

      const command = new SendEmailCommand({
        Source: fromAddress,
        Destination: {
          ToAddresses: [message.to],
        },
        Message: {
          Subject: {
            Data: message.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: message.html,
              Charset: 'UTF-8',
            },
            ...(message.text && {
              Text: {
                Data: message.text,
                Charset: 'UTF-8',
              },
            }),
          },
        },
        ReplyToAddresses: message.replyTo ? [message.replyTo] : undefined,
      });

      const response = await this.client.send(command);

      this.logger.log(`Email sent via SES: ${response.MessageId}`);

      return {
        success: true,
        messageId: response.MessageId,
        provider: this.name,
        rawResponse: response,
      };
    } catch (error) {
      this.logger.error(`SES send error: ${error.message}`, error.stack);

      return {
        success: false,
        provider: this.name,
        error: error.message,
        rawResponse: error,
      };
    }
  }

  async sendBatch(messages: EmailMessage[]): Promise<SendResult[]> {
    const results: SendResult[] = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    return results;
  }
}
