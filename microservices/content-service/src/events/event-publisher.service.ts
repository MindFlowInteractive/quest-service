import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export enum ContentEvent {
  CONTENT_CREATED = 'content.created',
  CONTENT_PUBLISHED = 'content.published',
  CONTENT_FEATURED = 'content.featured',
  CONTENT_ARCHIVED = 'content.archived',
  SUBMISSION_APPROVED = 'content.submission.approved',
  SUBMISSION_REJECTED = 'content.submission.rejected',
  CONTENT_FLAGGED = 'content.flagged',
}

export interface EventPayload {
  eventType: ContentEvent;
  timestamp: Date;
  data: Record<string, any>;
}

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly exchange = 'content-events';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const rabbitmqUrl = this.configService.get<string>(
        'RABBITMQ_URL',
        'amqp://admin:rabbitmq123@rabbitmq:5672',
      );

      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed, attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });

      this.logger.log('Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publish(eventType: ContentEvent, data: Record<string, any>): Promise<void> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not available, event not published');
      return;
    }

    const payload: EventPayload = {
      eventType,
      timestamp: new Date(),
      data,
    };

    try {
      this.channel.publish(
        this.exchange,
        eventType,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true },
      );

      this.logger.log(`Event published: ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${eventType}:`, error);
    }
  }

  async publishContentCreated(contentId: string, userId: string, contentType: string): Promise<void> {
    await this.publish(ContentEvent.CONTENT_CREATED, {
      contentId,
      userId,
      contentType,
    });
  }

  async publishContentPublished(contentId: string, userId: string, title: string): Promise<void> {
    await this.publish(ContentEvent.CONTENT_PUBLISHED, {
      contentId,
      userId,
      title,
    });
  }

  async publishContentFeatured(
    contentId: string,
    userId: string,
    slot: string,
    reason: string,
  ): Promise<void> {
    await this.publish(ContentEvent.CONTENT_FEATURED, {
      contentId,
      userId,
      slot,
      reason,
    });
  }

  async publishSubmissionApproved(
    submissionId: string,
    contentId: string,
    userId: string,
    moderatorId: string,
  ): Promise<void> {
    await this.publish(ContentEvent.SUBMISSION_APPROVED, {
      submissionId,
      contentId,
      userId,
      moderatorId,
    });
  }

  async publishSubmissionRejected(
    submissionId: string,
    contentId: string,
    userId: string,
    moderatorId: string,
    reason: string,
  ): Promise<void> {
    await this.publish(ContentEvent.SUBMISSION_REJECTED, {
      submissionId,
      contentId,
      userId,
      moderatorId,
      reason,
    });
  }

  async publishContentFlagged(
    contentId: string,
    reporterId: string,
    reason: string,
  ): Promise<void> {
    await this.publish(ContentEvent.CONTENT_FLAGGED, {
      contentId,
      reporterId,
      reason,
    });
  }

  async publishContentArchived(contentId: string, userId: string, reason: string): Promise<void> {
    await this.publish(ContentEvent.CONTENT_ARCHIVED, {
      contentId,
      userId,
      reason,
    });
  }
}
