import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage, ConfirmChannel } from 'amqplib';
import { BaseEvent, DLQMessage, EventHandlerConfig } from '../types/event.types';
import { EventBusConfig, calculateRetryDelay } from './event-bus.config';

export type EventHandler<T = any> = (event: BaseEvent<T>) => Promise<void>;

@Injectable()
export class EventSubscriber implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventSubscriber.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly exchangeName: string;
  private readonly dlqPrefix: string;
  private readonly handlers = new Map<string, EventHandler>();
  private readonly handlerConfigs = new Map<string, EventHandlerConfig>();

  constructor(private readonly config: EventBusConfig) {
    this.exchangeName = config.exchangeName || 'quest.events';
    this.dlqPrefix = config.dlqPrefix || 'dlq';
  }

  async onModuleInit(): Promise<void> {
    await this.initializeConnection();
  }

  /**
   * Initialize RabbitMQ connection
   */
  private async initializeConnection(): Promise<void> {
    const { url, username, password, vhost, heartbeat } = this.config.rabbitmq;
    
    const connectionUrl = `amqp://${username}:${password}@${url}${vhost ? `/${vhost}` : ''}`;

    this.connection = amqp.connect([connectionUrl], {
      heartbeatIntervalInSeconds: heartbeat || 60,
      reconnectTimeInSeconds: 5,
    });

    this.connection.on('connect', () => {
      this.logger.log('Subscriber connected to RabbitMQ');
    });

    this.connection.on('disconnect', (err) => {
      this.logger.warn('Subscriber disconnected from RabbitMQ', err?.message);
    });

    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(this.exchangeName, 'topic', {
          durable: true,
        });
      },
    });
  }

  /**
   * Subscribe to an event type
   */
  async subscribe<T>(
    config: EventHandlerConfig,
    handler: EventHandler<T>,
  ): Promise<void> {
    this.handlers.set(config.eventType, handler);
    this.handlerConfigs.set(config.eventType, config);

    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      const { queue, eventType, prefetchCount } = config;
      const dlqName = `${this.dlqPrefix}.${queue}`;

      // Create DLQ
      await channel.assertQueue(dlqName, {
        durable: true,
        arguments: {
          'x-queue-type': 'classic',
        },
      });

      // Create main queue with DLQ configuration
      await channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': dlqName,
        },
      });

      // Bind queue to exchange
      await channel.bindQueue(queue, this.exchangeName, eventType);

      // Set prefetch count
      await channel.prefetch(prefetchCount || 1);

      // Start consuming
      await channel.consume(
        queue,
        (msg) => this.handleMessage(msg, config),
        { noAck: false },
      );

      this.logger.log(
        `Subscribed to event: ${eventType} on queue: ${queue}`,
      );
    });
  }

  /**
   * Handle incoming message with retry logic
   */
  private async handleMessage(
    msg: ConsumeMessage | null,
    config: EventHandlerConfig,
  ): Promise<void> {
    if (!msg) {
      return;
    }

    const event: BaseEvent = JSON.parse(msg.content.toString());
    const handler = this.handlers.get(config.eventType);

    if (!handler) {
      this.logger.error(`No handler found for event: ${config.eventType}`);
      await this.channelWrapper.nack(msg, false, false);
      return;
    }

    const attempts = this.getAttemptCount(msg);
    const maxAttempts = config.retryAttempts || this.config.retry.maxAttempts;

    try {
      this.logger.log(
        `Processing event: ${event.metadata.eventType} [TraceID: ${event.metadata.traceId}] (Attempt ${attempts}/${maxAttempts})`,
      );

      await handler(event);

      // Acknowledge successful processing
      await this.channelWrapper.ack(msg);

      this.logger.log(
        `Successfully processed event: ${event.metadata.eventType} [TraceID: ${event.metadata.traceId}]`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing event: ${event.metadata.eventType} [TraceID: ${event.metadata.traceId}]`,
        error.stack,
      );

      await this.handleFailure(msg, event, error, attempts, maxAttempts, config);
    }
  }

  /**
   * Handle message processing failure
   */
  private async handleFailure(
    msg: ConsumeMessage,
    event: BaseEvent,
    error: any,
    attempts: number,
    maxAttempts: number,
    config: EventHandlerConfig,
  ): Promise<void> {
    if (attempts < maxAttempts) {
      // Retry with exponential backoff
      const delay = calculateRetryDelay(attempts, this.config.retry);
      
      this.logger.warn(
        `Retrying event ${event.metadata.eventType} in ${delay}ms (Attempt ${attempts + 1}/${maxAttempts})`,
      );

      // Nack and requeue with delay
      await this.channelWrapper.nack(msg, false, false);
      
      // Republish with delay
      setTimeout(async () => {
        await this.republishWithRetry(event, attempts + 1, config.queue);
      }, delay);
    } else {
      // Max retries exceeded, send to DLQ
      this.logger.error(
        `Max retries exceeded for event: ${event.metadata.eventType}. Moving to DLQ.`,
      );

      await this.sendToDLQ(event, error, attempts, config.queue);
      await this.channelWrapper.ack(msg); // Acknowledge to remove from main queue
    }
  }

  /**
   * Republish message with retry count
   */
  private async republishWithRetry(
    event: BaseEvent,
    attempts: number,
    queue: string,
  ): Promise<void> {
    await this.channelWrapper.sendToQueue(queue, event, {
      persistent: true,
      headers: {
        'x-retry-count': attempts,
      },
    });
  }

  /**
   * Send message to Dead Letter Queue
   */
  private async sendToDLQ(
    event: BaseEvent,
    error: any,
    attempts: number,
    queue: string,
  ): Promise<void> {
    const dlqMessage: DLQMessage = {
      originalEvent: event,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
      },
      attempts,
      lastAttempt: new Date(),
    };

    const dlqName = `${this.dlqPrefix}.${queue}`;

    await this.channelWrapper.sendToQueue(dlqName, dlqMessage, {
      persistent: true,
    });

    this.logger.log(`Message sent to DLQ: ${dlqName}`);
  }

  /**
   * Get retry attempt count from message headers
   */
  private getAttemptCount(msg: ConsumeMessage): number {
    return (msg.properties.headers?.['x-retry-count'] as number) || 1;
  }

  /**
   * Close connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.channelWrapper.close();
    await this.connection.close();
    this.logger.log('Event subscriber connection closed');
  }
}
