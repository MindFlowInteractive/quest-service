import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookEvent } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import * as https from 'https';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private deliveryRepository: Repository<WebhookDelivery>,
    @InjectQueue('webhook-delivery') private deliveryQueue: Queue,
  ) {}

  async create(createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    // Validate URL is HTTPS
    const url = new URL(createWebhookDto.url);
    if (url.protocol !== 'https:') {
      throw new BadRequestException('Webhook URL must use HTTPS');
    }

    // Validate URL is reachable
    await this.validateUrlReachable(createWebhookDto.url);

    const webhook = this.webhookRepository.create(createWebhookDto);
    return this.webhookRepository.save(webhook);
  }

  async findAll(userId?: string, appId?: string): Promise<Webhook[]> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (appId) where.appId = appId;

    return this.webhookRepository.find({ where });
  }

  async findOne(id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return webhook;
  }

  async remove(id: string): Promise<void> {
    const result = await this.webhookRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Webhook not found');
    }
  }

  async getDeliveries(webhookId: string, limit = 100): Promise<WebhookDelivery[]> {
    return this.deliveryRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async triggerEvent(event: WebhookEvent, payload: any): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { events: event, active: true },
    });

    for (const webhook of webhooks) {
      await this.queueDelivery(webhook, event, payload);
    }
  }

  private async queueDelivery(webhook: Webhook, event: string, payload: any): Promise<void> {
    const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);

    const delivery = await this.deliveryRepository.save({
      webhookId: webhook.id,
      event,
      payload,
      signature,
      status: 'pending',
    });

    await this.deliveryQueue.add('deliver', {
      deliveryId: delivery.id,
    });
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  private async validateUrlReachable(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = https.request(url, { method: 'HEAD' }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          reject(new BadRequestException(`URL returned status ${res.statusCode}`));
        }
      });

      req.on('error', () => {
        reject(new BadRequestException('URL is not reachable'));
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new BadRequestException('URL validation timed out'));
      });

      req.end();
    });
  }
}