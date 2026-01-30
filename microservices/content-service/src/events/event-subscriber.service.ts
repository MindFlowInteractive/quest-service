import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { ContentService } from '../content/content.service.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class EventSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventSubscriberService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName = 'content-service-events';

  constructor(
    private readonly configService: ConfigService,
    private readonly contentService: ContentService,
    private readonly storageService: StorageService,
  ) {}

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

      await this.channel.assertQueue(this.queueName, { durable: true });

      // Try to bind to external exchanges, but don't fail if they don't exist
      try {
        await this.channel.assertExchange('user-events', 'topic', { durable: true });
        await this.channel.bindQueue(this.queueName, 'user-events', 'user.banned');
      } catch (err) {
        this.logger.warn('Could not bind to user-events exchange');
      }

      try {
        await this.channel.assertExchange('storage-events', 'topic', { durable: true });
        await this.channel.bindQueue(this.queueName, 'storage-events', 'file.processed');
      } catch (err) {
        this.logger.warn('Could not bind to storage-events exchange');
      }

      await this.channel.consume(this.queueName, this.handleMessage.bind(this), {
        noAck: false,
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed, attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });

      this.logger.log('Event subscriber connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect event subscriber to RabbitMQ:', error);
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
      this.logger.log('Event subscriber disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting event subscriber from RabbitMQ:', error);
    }
  }

  private async handleMessage(msg: amqp.ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) return;

    try {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      this.logger.log(`Received event: ${routingKey}`);

      switch (routingKey) {
        case 'user.banned':
          await this.handleUserBanned(content.data);
          break;
        case 'file.processed':
          await this.handleFileProcessed(content.data);
          break;
        default:
          this.logger.warn(`Unknown event type: ${routingKey}`);
      }

      this.channel.ack(msg);
    } catch (error) {
      this.logger.error('Error handling message:', error);
      this.channel.nack(msg, false, false);
    }
  }

  private async handleUserBanned(data: { userId: string; reason: string }): Promise<void> {
    this.logger.log(`Handling user.banned event for user ${data.userId}`);

    try {
      await this.contentService.archiveUserContent(data.userId);
      this.logger.log(`Archived all content for banned user ${data.userId}`);
    } catch (error) {
      this.logger.error(`Failed to archive content for user ${data.userId}:`, error);
      throw error;
    }
  }

  private async handleFileProcessed(data: {
    fileId: string;
    success: boolean;
    metadata?: Record<string, any>;
    error?: string;
  }): Promise<void> {
    this.logger.log(`Handling file.processed event for file ${data.fileId}`);

    try {
      if (data.success) {
        await this.storageService.markFileAsProcessed(data.fileId, data.metadata);
        this.logger.log(`File ${data.fileId} marked as processed`);
      } else {
        await this.storageService.markFileAsFailed(data.fileId, data.error || 'Unknown error');
        this.logger.warn(`File ${data.fileId} processing failed: ${data.error}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update file ${data.fileId} status:`, error);
      throw error;
    }
  }
}
