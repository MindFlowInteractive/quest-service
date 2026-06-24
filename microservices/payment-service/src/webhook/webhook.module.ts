import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [PaymentModule, SubscriptionModule, InvoiceModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
