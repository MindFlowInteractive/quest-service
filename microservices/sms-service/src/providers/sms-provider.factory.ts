import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SmsPayload,
  SmsProvider,
  SmsSendResult,
} from './interfaces/sms-provider.interface';
import { MockProvider } from './mock.provider';
import { SnsProvider } from './sns.provider';
import { TwilioProvider } from './twilio.provider';

@Injectable()
export class SmsProviderFactory implements OnModuleInit {
  private readonly logger = new Logger(SmsProviderFactory.name);
  private provider: SmsProvider;
  private fallbackProvider: SmsProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly twilioProvider: TwilioProvider,
    private readonly snsProvider: SnsProvider,
    private readonly mockProvider: MockProvider,
  ) {}

  onModuleInit() {
    const configuredProvider = this.configService.get<string>('sms.provider', 'mock');

    switch (configuredProvider) {
      case 'twilio':
        this.provider = this.twilioProvider.validateConfig()
          ? this.twilioProvider
          : this.mockProvider;
        this.fallbackProvider = this.snsProvider.validateConfig()
          ? this.snsProvider
          : this.mockProvider;
        break;
      case 'sns':
        this.provider = this.snsProvider.validateConfig()
          ? this.snsProvider
          : this.mockProvider;
        this.fallbackProvider = this.twilioProvider.validateConfig()
          ? this.twilioProvider
          : this.mockProvider;
        break;
      default:
        this.provider = this.mockProvider;
        this.fallbackProvider = this.twilioProvider.validateConfig()
          ? this.twilioProvider
          : this.snsProvider.validateConfig()
            ? this.snsProvider
            : this.mockProvider;
    }

    this.logger.log(`Primary SMS provider: ${this.provider.name}`);
    this.logger.log(`Fallback SMS provider: ${this.fallbackProvider.name}`);
  }

  getProvider(): SmsProvider {
    return this.provider;
  }

  async send(payload: SmsPayload): Promise<SmsSendResult> {
    const result = await this.provider.send(payload);

    if (!result.success && this.fallbackProvider.name !== this.provider.name) {
      this.logger.warn(
        `Primary provider ${this.provider.name} failed, retrying with ${this.fallbackProvider.name}`,
      );
      return this.fallbackProvider.send(payload);
    }

    return result;
  }
}
