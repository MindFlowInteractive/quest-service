import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { Webhook } from './entities/webhook.entity';
import { WebhookDelivery } from './entities/webhook-delivery.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import {
  WEBHOOK_DELIVERY_RETENTION_LIMIT,
  WEBHOOK_DELIVERY_TTL_DAYS,
  WEBHOOK_INITIAL_RETRY_DELAY_MS,
  WEBHOOK_JOB,
  WEBHOOK_QUEUE,
  WEBHOOK_TOTAL_ATTEMPTS,
  WebhookEvent,
} from './webhook.constants';
import { createWebhookSignature } from './webhook-signature.util';
import { WebhookUrlValidatorService } from './webhook-url-validator.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
    @InjectQueue(WEBHOOK_QUEUE)
    private readonly deliveryQueue: Queue,
    private readonly webhookUrlValidator: WebhookUrlValidatorService,
    private readonly configService: ConfigService,
  ) {}

  async create(ownerUserId: string, createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    await this.webhookUrlValidator.validate(createWebhookDto.url);

    const webhook = this.webhookRepository.create({
      ...createWebhookDto,
      userId: ownerUserId,
      active: true,
    });

    const savedWebhook = await this.webhookRepository.save(webhook);
    return this.findOwnedWebhook(ownerUserId, savedWebhook.id);
  }

  async findAll(ownerUserId: string, appId?: string): Promise<Webhook[]> {
    const where: Record<string, string> = { userId: ownerUserId };

    if (appId) {
      where.appId = appId;
    }

    return this.webhookRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOwnedWebhook(ownerUserId: string, id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id, userId: ownerUserId } });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async remove(ownerUserId: string, id: string): Promise<void> {
    const webhook = await this.findOwnedWebhook(ownerUserId, id);
    await this.webhookRepository.remove(webhook);
  }

  async getDeliveries(ownerUserId: string, webhookId: string, limit = 100): Promise<WebhookDelivery[]> {
    await this.findOwnedWebhook(ownerUserId, webhookId);

    return this.deliveryRepository.find({
      where: { webhookId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, WEBHOOK_DELIVERY_RETENTION_LIMIT),
    });
  }

  async enqueueEvent(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
    const webhooks = await this.webhookRepository
      .createQueryBuilder('webhook')
      .addSelect('webhook.secret')
      .where('webhook.active = :active', { active: true })
      .andWhere(':event = ANY(webhook.events)', { event })
      .getMany();

    for (const webhook of webhooks) {
      await this.queueDelivery(webhook, event, payload);
    }
  }

  toResponse(webhook: Webhook) {
    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      userId: webhook.userId,
      appId: webhook.appId,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    };
  }

  buildSignature(payload: Record<string, unknown> | string, secret: string): string {
    const serializedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return createWebhookSignature(serializedPayload, secret);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredDeliveries(): Promise<void> {
    const ttlDays = this.configService.get<number>('WEBHOOK_DELIVERY_TTL_DAYS', WEBHOOK_DELIVERY_TTL_DAYS);

    if (ttlDays <= 0) {
      return;
    }

    const cutoff = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);
    const result = await this.deliveryRepository
      .createQueryBuilder()
      .delete()
      .from(WebhookDelivery)
      .where('createdAt < :cutoff', { cutoff })
      .execute();

    if (result.affected) {
      this.logger.log(`Cleaned up ${result.affected} expired webhook deliveries`);
    }
  }

  private async queueDelivery(
    webhook: Webhook & { secret?: string },
    event: WebhookEvent,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const signature = this.buildSignature(payload, webhook.secret || '');

    const delivery = await this.deliveryRepository.save(
      this.deliveryRepository.create({
      webhookId: webhook.id,
      event,
      payload,
      signature,
      status: 'pending',
      }),
    );

    await this.pruneDeliveryHistory(webhook.id);

    const ttlDays = this.configService.get<number>('WEBHOOK_DELIVERY_TTL_DAYS', WEBHOOK_DELIVERY_TTL_DAYS);
    const ageSeconds = Math.max(ttlDays, 1) * 24 * 60 * 60;

    await this.deliveryQueue.add(
      WEBHOOK_JOB,
      { deliveryId: delivery.id },
      {
        jobId: delivery.id,
        attempts: WEBHOOK_TOTAL_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: WEBHOOK_INITIAL_RETRY_DELAY_MS,
        },
        removeOnComplete: {
          count: WEBHOOK_DELIVERY_RETENTION_LIMIT,
          age: ageSeconds,
        },
        removeOnFail: {
          count: WEBHOOK_DELIVERY_RETENTION_LIMIT,
          age: ageSeconds,
        },
      },
    );
  }

  private async pruneDeliveryHistory(webhookId: string): Promise<void> {
    const staleDeliveries = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .select('delivery.id', 'id')
      .where('delivery.webhookId = :webhookId', { webhookId })
      .orderBy('delivery.createdAt', 'DESC')
      .offset(WEBHOOK_DELIVERY_RETENTION_LIMIT)
      .getRawMany<{ id: string }>();

    if (staleDeliveries.length === 0) {
      return;
    }

    await this.deliveryRepository.delete(staleDeliveries.map((delivery) => delivery.id));
  }
}