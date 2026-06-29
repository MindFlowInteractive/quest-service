import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookProvider } from './webhook.provider';
import { Webhook } from './entities/webhook.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Webhook]),
        HttpModule,
    ],
    controllers: [WebhooksController],
    providers: [WebhooksService, WebhookProvider],
    exports: [WebhooksService],
})
export class WebhooksModule {}
