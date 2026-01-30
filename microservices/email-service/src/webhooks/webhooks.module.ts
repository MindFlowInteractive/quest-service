import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { TrackingModule } from '../tracking/tracking.module';
import { UnsubscribeModule } from '../unsubscribe/unsubscribe.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [TrackingModule, UnsubscribeModule, EmailsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
