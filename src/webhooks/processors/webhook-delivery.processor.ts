import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookDelivery } from '../entities/webhook-delivery.entity';
import axios, { AxiosError } from 'axios';
import {
  WEBHOOK_INITIAL_RETRY_DELAY_MS,
  WEBHOOK_MAX_RETRIES,
  WEBHOOK_QUEUE,
} from '../webhook.constants';

@Injectable()
@Processor(WEBHOOK_QUEUE)
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
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
          'X-Webhook-Delivery-ID': delivery.id,
          'X-Webhook-Timestamp': delivery.createdAt.toISOString(),
        },
        timeout: 10000,
      });

      delivery.status = 'success';
      delivery.responseCode = response.status;
      delivery.responseBody = this.serializeResponseBody(response.data);
      delivery.error = undefined;
      delivery.nextRetryAt = undefined;
      delivery.retryCount = job.attemptsMade;
      delivery.deliveredAt = new Date();

      this.logger.log(`Webhook delivered successfully: ${deliveryId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      const currentAttempt = job.attemptsMade + 1;
      const shouldRetry = currentAttempt <= WEBHOOK_MAX_RETRIES;

      delivery.responseCode = axiosError.response?.status;
      delivery.responseBody = this.serializeResponseBody(axiosError.response?.data);
      delivery.error = axiosError.message;
      delivery.retryCount = Math.min(currentAttempt, WEBHOOK_MAX_RETRIES);

      if (shouldRetry) {
        delivery.status = 'retry';
        delivery.nextRetryAt = new Date(
          Date.now() + WEBHOOK_INITIAL_RETRY_DELAY_MS * Math.pow(2, currentAttempt - 1),
        );

        this.logger.warn(
          `Webhook delivery failed, retrying (${delivery.retryCount}/${WEBHOOK_MAX_RETRIES}): ${deliveryId}`,
        );
      } else {
        delivery.status = 'failed';
        delivery.nextRetryAt = undefined;
        this.logger.error(`Webhook delivery failed permanently: ${deliveryId}`);
      }

      await this.deliveryRepository.save(delivery);
      throw error;
    }

    await this.deliveryRepository.save(delivery);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${err.message}`);
  }

  private serializeResponseBody(data: unknown): string | undefined {
    if (data == null) {
      return undefined;
    }

    return typeof data === 'string' ? data : JSON.stringify(data);
  }
}