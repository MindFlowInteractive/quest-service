import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsSnsSmsProvider } from './aws-sns.provider';
import { ConsoleSmsProvider } from './console.provider';
import { SmsProvider } from './interfaces/sms-provider.interface';
import { TwilioSmsProvider } from './twilio.provider';

@Injectable()
export class SmsProviderFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly consoleProvider: ConsoleSmsProvider,
    private readonly twilioProvider: TwilioSmsProvider,
    private readonly awsSnsProvider: AwsSnsSmsProvider,
  ) {}

  getProvider(): SmsProvider {
    const provider = this.configService.get<string>('sms.provider', 'console');

    if (provider === 'twilio') {
      return this.twilioProvider;
    }

    if (provider === 'aws-sns') {
      return this.awsSnsProvider;
    }

    return this.consoleProvider;
  }
}
