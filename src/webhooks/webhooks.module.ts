import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookDeliveryProcessor } from './processors/webhook-delivery.processor';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { WEBHOOK_QUEUE } from './webhook.constants';
import { WebhookUrlValidatorService } from './webhook-url-validator.service';
import { WebhookEventsListener } from './webhook-events.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook, WebhookDelivery]),
    BullModule.registerQueue({
      name: WEBHOOK_QUEUE,
    }),
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhookDeliveryProcessor,
    WebhookUrlValidatorService,
    WebhookEventsListener,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}