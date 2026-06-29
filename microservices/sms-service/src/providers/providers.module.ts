import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MockProvider } from './mock.provider';
import { SnsProvider } from './sns.provider';
import { SmsProviderFactory } from './sms-provider.factory';
import { TwilioProvider } from './twilio.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    MockProvider,
    SnsProvider,
    SmsProviderFactory,
    TwilioProvider,
  ],
  exports: [SmsProviderFactory],
})
export class ProvidersModule {}
