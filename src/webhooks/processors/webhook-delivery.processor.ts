import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebhooksService } from '../webhooks.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookDelivery } from '../entities/webhook-delivery.entity';
import axios, { AxiosError } from 'axios';

@Injectable()
@Processor('webhook-delivery')
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

  constructor(
    private readonly webhooksService: WebhooksService,
    @InjectRepository(WebhookDelivery)
    private deliveryRepository: Repository<WebhookDelivery>,
  ) {
    super();
  }

  async process(job: Job<{ deliveryId: string }>): Promise<void> {
    const { deliveryId } = job.data;

    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['webhook'],
    });

    if (!delivery) {
      this.logger.error(`Delivery ${deliveryId} not found`);
      return;
    }

    try {
      const response = await axios.post(delivery.webhook.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': delivery.signature,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-ID': delivery.id,
        },
        timeout: 10000, // 10 seconds
      });

      delivery.status = 'success';
      delivery.responseCode = response.status;
      delivery.deliveredAt = new Date();

      this.logger.log(`Webhook delivered successfully: ${deliveryId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      delivery.responseCode = axiosError.response?.status;
      delivery.responseBody = axiosError.response?.data as string;
      delivery.error = axiosError.message;

      if (delivery.retryCount < this.maxRetries) {
        delivery.status = 'retry';
        delivery.retryCount++;
        delivery.nextRetryAt = new Date(Date.now() + this.retryDelays[delivery.retryCount - 1]);

        // Re-queue the job
        await job.queue.add('deliver', { deliveryId }, {
          delay: this.retryDelays[delivery.retryCount - 1],
          priority: 10 - delivery.retryCount, // Higher priority for earlier retries
        });

        this.logger.warn(`Webhook delivery failed, retrying (${delivery.retryCount}/${this.maxRetries}): ${deliveryId}`);
      } else {
        delivery.status = 'failed';
        this.logger.error(`Webhook delivery failed permanently: ${deliveryId}`);
      }
    }

    await this.deliveryRepository.save(delivery);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${err.message}`);
  }
}