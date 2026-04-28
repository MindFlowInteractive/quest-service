import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { WebhookProvider, WebhookPayload } from './webhook.provider';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
        @InjectRepository(Webhook)
        private readonly webhookRepository: Repository<Webhook>,
        private readonly webhookProvider: WebhookProvider,
    ) {}

    async create(userId: string, url: string, events: string[], secret?: string) {
        const webhook = this.webhookRepository.create({
            userId,
            url,
            events,
            secret,
            isActive: true,
        });
        return this.webhookRepository.save(webhook);
    }

    async findByUserId(userId: string) {
        return this.webhookRepository.find({
            where: { userId, isActive: true },
        });
    }

    async findByEvent(eventType: string) {
        return this.webhookRepository
            .createQueryBuilder('webhook')
            .where('webhook.isActive = :isActive', { isActive: true })
            .andWhere('webhook.events @> :eventType', { eventType: `[${eventType}]` })
            .getMany();
    }

    async update(id: string, updates: Partial<Webhook>) {
        await this.webhookRepository.update(id, updates);
        return this.webhookRepository.findOne({ where: { id } });
    }

    async delete(id: string) {
        await this.webhookRepository.update(id, { isActive: false });
    }

    async triggerWebhooks(eventType: string, data: any) {
        const webhooks = await this.findByEvent(eventType);
        
        const payload: WebhookPayload = {
            eventType,
            data,
            timestamp: new Date().toISOString(),
        };

        const results = await Promise.allSettled(
            webhooks.map(webhook => this.sendWebhook(webhook, payload))
        );

        this.logger.log(`Triggered ${webhooks.length} webhooks for event ${eventType}`);
        
        return results;
    }

    private async sendWebhook(webhook: Webhook, payload: WebhookPayload) {
        const result = await this.webhookProvider.send(webhook, payload);

        const updates: Partial<Webhook> = {
            lastTriggeredAt: new Date(),
        };

        if (result.success) {
            updates.lastSuccessAt = new Date();
            updates.failureCount = 0;
        } else {
            updates.lastFailureAt = new Date();
            updates.failureCount = (webhook.failureCount || 0) + 1;

            // Disable webhook after 5 consecutive failures
            if (updates.failureCount >= 5) {
                updates.isActive = false;
                this.logger.warn(`Webhook ${webhook.id} disabled after 5 failures`);
            }
        }

        await this.webhookRepository.update(webhook.id, updates);
        
        return result;
    }
}
