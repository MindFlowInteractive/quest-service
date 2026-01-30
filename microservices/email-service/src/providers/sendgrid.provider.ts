import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import {
  EmailProvider,
  EmailMessage,
  SendResult,
} from '../interfaces/email-provider.interface';

@Injectable()
export class SendGridProvider implements EmailProvider {
  private readonly logger = new Logger(SendGridProvider.name);
  readonly name = 'sendgrid';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.sendgrid.apiKey');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  validateConfig(): boolean {
    const apiKey = this.configService.get<string>('email.sendgrid.apiKey');
    return !!apiKey;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    try {
      const msg: sgMail.MailDataRequired = {
        to: message.toName
          ? { email: message.to, name: message.toName }
          : message.to,
        from: message.fromName
          ? { email: message.from, name: message.fromName }
          : message.from,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo,
        headers: message.headers,
        customArgs: message.metadata,
      };

      if (message.attachments?.length) {
        msg.attachments = message.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          type: att.contentType,
          disposition: 'attachment',
        }));
      }

      const [response] = await sgMail.send(msg);

      this.logger.log(`Email sent via SendGrid: ${response.headers['x-message-id']}`);

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        provider: this.name,
        rawResponse: response,
      };
    } catch (error) {
      this.logger.error(`SendGrid send error: ${error.message}`, error.stack);

      return {
        success: false,
        provider: this.name,
        error: error.message,
        rawResponse: error.response?.body,
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
