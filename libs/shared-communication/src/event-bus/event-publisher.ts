import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, Options } from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { BaseEvent, EventMetadata, PublishOptions } from '../types/event.types';
import { EventBusConfig } from './event-bus.config';

@Injectable()
export class EventPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(EventPublisher.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly exchangeName: string;
  private readonly serviceName: string;

  constructor(private readonly config: EventBusConfig) {
    this.exchangeName = config.exchangeName || 'quest.events';
    this.serviceName = config.serviceName;
    this.initializeConnection();
  }

  /**
   * Initialize RabbitMQ connection with automatic reconnection
   */
  private initializeConnection(): void {
    const { url, username, password, vhost, heartbeat } = this.config.rabbitmq;
    
    const connectionUrl = `amqp://${username}:${password}@${url}${vhost ? `/${vhost}` : ''}`;

    this.connection = amqp.connect([connectionUrl], {
      heartbeatIntervalInSeconds: heartbeat || 60,
      reconnectTimeInSeconds: 5,
    });

    this.connection.on('connect', () => {
      this.logger.log('Successfully connected to RabbitMQ');
    });

    this.connection.on('disconnect', (err) => {
      this.logger.warn('Disconnected from RabbitMQ', err?.message);
    });

    this.connection.on('connectFailed', (err) => {
      this.logger.error('Failed to connect to RabbitMQ', err?.message);
    });

    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(this.exchangeName, 'topic', {
          durable: true,
        });
        this.logger.log(`Exchange '${this.exchangeName}' asserted`);
      },
    });
  }

  /**
   * Publish an event to the message bus
   */
  async publish<T>(
    eventType: string,
    payload: T,
    options: PublishOptions = {},
  ): Promise<void> {
    const metadata: EventMetadata = {
      timestamp: new Date(),
      traceId: uuidv4(),
      eventType,
      version: '1.0',
      source: this.serviceName,
      correlationId: options.headers?.correlationId,
    };

    const event: BaseEvent<T> = {
      metadata,
      payload,
    };

    const publishOptions: Options.Publish = {
      persistent: options.persistent !== false,
      priority: options.priority || 0,
      expiration: options.expiration,
      headers: {
        ...options.headers,
        'x-trace-id': metadata.traceId,
        'x-source': this.serviceName,
      },
    };

    try {
      await this.channelWrapper.publish(
        this.exchangeName,
        eventType,
        event,
        publishOptions,
      );

      this.logger.log(
        `Published event: ${eventType} [TraceID: ${metadata.traceId}]`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event: ${eventType}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch<T>(
    events: Array<{ eventType: string; payload: T; options?: PublishOptions }>,
  ): Promise<void> {
    const publishPromises = events.map((event) =>
      this.publish(event.eventType, event.payload, event.options),
    );

    await Promise.all(publishPromises);
  }

  /**
   * Close connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.channelWrapper.close();
    await this.connection.close();
    this.logger.log('Event publisher connection closed');
  }
}
