import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHmac } from 'crypto';
import { WebhookSubscription } from '../../entities';
import { CreateWebhookSubscriptionDto, UpdateWebhookSubscriptionDto } from '../../common';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookSubscription)
    private webhookRepository: Repository<WebhookSubscription>,
    private httpService: HttpService,
    private auditLogService: AuditLogService,
  ) {}

  async createWebhook(
    createWebhookDto: CreateWebhookSubscriptionDto,
    userId?: string,
  ): Promise<WebhookSubscription> {
    const webhook = this.webhookRepository.create(createWebhookDto);
    const savedWebhook = await this.webhookRepository.save(webhook);

    await this.auditLogService.log(
      'CREATE',
      'WebhookSubscription',
      savedWebhook.id,
      createWebhookDto,
      userId,
    );

    return savedWebhook;
  }

  async updateWebhook(
    id: string,
    updateWebhookDto: UpdateWebhookSubscriptionDto,
    userId?: string,
  ): Promise<WebhookSubscription> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });

    if (!webhook) {
      throw new BadRequestException(`Webhook with ID "${id}" not found`);
    }

    Object.assign(webhook, updateWebhookDto);
    const updatedWebhook = await this.webhookRepository.save(webhook);

    await this.auditLogService.log('UPDATE', 'WebhookSubscription', id, updateWebhookDto, userId);

    return updatedWebhook;
  }

  async getWebhook(id: string): Promise<WebhookSubscription> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });

    if (!webhook) {
      throw new BadRequestException(`Webhook with ID "${id}" not found`);
    }

    return webhook;
  }

  async getWebhooksByService(serviceName: string): Promise<WebhookSubscription[]> {
    return this.webhookRepository.find({
      where: { serviceName, isActive: true },
    });
  }

  async getAllWebhooks(): Promise<WebhookSubscription[]> {
    return this.webhookRepository.find({ where: { isActive: true } });
  }

  async deleteWebhook(id: string, userId?: string): Promise<void> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });

    if (!webhook) {
      throw new BadRequestException(`Webhook with ID "${id}" not found`);
    }

    await this.webhookRepository.remove(webhook);

    await this.auditLogService.log(
      'DELETE',
      'WebhookSubscription',
      id,
      { serviceName: webhook.serviceName },
      userId,
    );
  }

  async triggerWebhook(
    event: string,
    data: Record<string, any>,
    webhookId?: string,
  ): Promise<void> {
    let webhooks: WebhookSubscription[];

    if (webhookId) {
      const webhook = await this.getWebhook(webhookId);
      webhooks = [webhook];
    } else {
      webhooks = await this.getAllWebhooks();
    }

    const targetWebhooks = webhooks.filter((w) => w.events && w.events.includes(event));

    for (const webhook of targetWebhooks) {
      await this.sendWebhookWithRetry(webhook, event, data);
    }
  }

  private async sendWebhookWithRetry(
    webhook: WebhookSubscription,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    let lastError: Error;

    for (let attempt = 0; attempt < webhook.retryAttempts; attempt++) {
      try {
        await this.sendWebhook(webhook, event, data);
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Webhook delivery attempt ${attempt + 1} failed for ${webhook.webhookUrl}: ${error.message}`,
        );

        if (attempt < webhook.retryAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, webhook.retryDelayMs * (attempt + 1)));
        }
      }
    }

    this.logger.error(
      `Webhook delivery failed after ${webhook.retryAttempts} attempts for ${webhook.webhookUrl}`,
      lastError,
    );
  }

  private async sendWebhook(
    webhook: WebhookSubscription,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (webhook.secret) {
      headers['X-Webhook-Signature'] = this.generateSignature(
        webhook.secret,
        JSON.stringify(payload),
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(webhook.webhookUrl, payload, { headers }),
      );

      if (response.status >= 200 && response.status < 300) {
        this.logger.debug(`Webhook delivered successfully to ${webhook.webhookUrl}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to deliver webhook: ${error.message || error.toString()}`);
    }
  }

  private generateSignature(secret: string, payload: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }
}
