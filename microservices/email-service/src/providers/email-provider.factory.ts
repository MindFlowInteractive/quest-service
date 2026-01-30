import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendGridProvider } from './sendgrid.provider';
import { SESProvider } from './ses.provider';
import {
  EmailProvider,
  EmailMessage,
  SendResult,
} from './interfaces/email-provider.interface';

@Injectable()
export class EmailProviderFactory implements OnModuleInit {
  private readonly logger = new Logger(EmailProviderFactory.name);
  private provider: EmailProvider;
  private fallbackProvider: EmailProvider | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly sendGridProvider: SendGridProvider,
    private readonly sesProvider: SESProvider,
  ) {}

  onModuleInit() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const primaryProvider = this.configService.get<string>('email.provider', 'sendgrid');

    if (primaryProvider === 'sendgrid') {
      this.provider = this.sendGridProvider;
      if (this.sesProvider.validateConfig()) {
        this.fallbackProvider = this.sesProvider;
      }
    } else if (primaryProvider === 'ses') {
      this.provider = this.sesProvider;
      if (this.sendGridProvider.validateConfig()) {
        this.fallbackProvider = this.sendGridProvider;
      }
    } else {
      this.provider = this.sendGridProvider;
    }

    this.logger.log(`Email provider initialized: ${this.provider.name}`);
    if (this.fallbackProvider) {
      this.logger.log(`Fallback provider available: ${this.fallbackProvider.name}`);
    }
  }

  getProvider(): EmailProvider {
    return this.provider;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    let result = await this.provider.send(message);

    if (!result.success && this.fallbackProvider) {
      this.logger.warn(
        `Primary provider ${this.provider.name} failed, trying fallback ${this.fallbackProvider.name}`,
      );
      result = await this.fallbackProvider.send(message);
    }

    return result;
  }

  async sendBatch(messages: EmailMessage[]): Promise<SendResult[]> {
    if (this.provider.sendBatch) {
      return this.provider.sendBatch(messages);
    }

    const results: SendResult[] = [];
    for (const message of messages) {
      results.push(await this.send(message));
    }
    return results;
  }
}
