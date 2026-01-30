import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SendGridProvider } from './sendgrid.provider';
import { SESProvider } from './ses.provider';
import { EmailProviderFactory } from './email-provider.factory';

@Module({
  imports: [ConfigModule],
  providers: [SendGridProvider, SESProvider, EmailProviderFactory],
  exports: [EmailProviderFactory, SendGridProvider, SESProvider],
})
export class ProvidersModule {}
