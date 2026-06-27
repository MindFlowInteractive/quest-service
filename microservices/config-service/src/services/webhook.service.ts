import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'crypto';
import { Repository } from 'typeorm';
import { Webhook } from '../entities';
import { RegisterWebhookDto } from '../dto/config.dto';

export interface ConfigUpdateEvent {
  event: 'config.updated' | 'config.deleted' | 'secret.updated' | 'secret.rotated';
  service: string;
  environment: string;
  key: string;
  version: number;
  occurredAt: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(@InjectRepository(Webhook) private readonly repository: Repository<Webhook>) {}

  register(dto: RegisterWebhookDto): Promise<Webhook> {
    return this.repository.save(this.repository.create(dto));
  }

  list(service?: string): Promise<Webhook[]> {
    return this.repository.find({ where: service ? { service } : {}, order: { createdAt: 'DESC' } });
  }

  async setActive(id: string, active: boolean): Promise<Webhook> {
    const webhook = await this.repository.findOne({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook not found');
    webhook.active = active;
    return this.repository.save(webhook);
  }

  async publish(event: ConfigUpdateEvent): Promise<void> {
    const hooks = await this.repository
      .createQueryBuilder('webhook')
      .addSelect('webhook.signingSecret')
      .where('webhook.service = :service', { service: event.service })
      .andWhere('webhook.environment = :environment', { environment: event.environment })
      .andWhere('webhook.active = true')
      .getMany();
    await Promise.allSettled(hooks.map((hook) => this.deliver(hook, event)));
  }

  private async deliver(hook: Webhook, event: ConfigUpdateEvent): Promise<void> {
    const body = JSON.stringify(event);
    const headers: Record<string, string> = { 'content-type': 'application/json', 'x-config-event': event.event };
    if (hook.signingSecret) headers['x-config-signature'] = `sha256=${createHmac('sha256', hook.signingSecret).update(body).digest('hex')}`;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(hook.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(5000) });
        if (response.ok) return;
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (attempt === 3) this.logger.error(`Webhook ${hook.id} failed after 3 attempts: ${String(error)}`);
        else await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
    }
  }
}
