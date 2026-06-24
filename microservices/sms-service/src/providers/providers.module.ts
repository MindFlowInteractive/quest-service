import { Module } from '@nestjs/common';
import { AwsSnsSmsProvider } from './aws-sns.provider';
import { ConsoleSmsProvider } from './console.provider';
import { SmsProviderFactory } from './sms-provider.factory';
import { TwilioSmsProvider } from './twilio.provider';

@Module({
  providers: [
    AwsSnsSmsProvider,
    ConsoleSmsProvider,
    SmsProviderFactory,
    TwilioSmsProvider,
  ],
  exports: [SmsProviderFactory],
})
export class ProvidersModule {}
