import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import * as amqpConnectionManager from 'amqp-connection-manager';
import { 
  IMessageBroker, 
  PublishOptions, 
  QueueOptions, 
  ExchangeOptions, 
  ExchangeType,
  RetryConfig,
  DeadLetterConfig
} from '../interfaces';

@Injectable()
export class RabbitMQService implements IMessageBroker, OnModuleInit, OnModuleDestroy {
  private connection: amqpConnectionManager.AmqpConnectionManager;
  private channel: amqpConnectionManager.ChannelWrapper;
  private readonly retryConfig: RetryConfig;
  private readonly deadLetterConfig: DeadLetterConfig;

  constructor(private readonly configService: ConfigService) {
    this.retryConfig = {
      maxRetries: this.configService.get<number>('RABBITMQ_MAX_RETRIES', 3),
      initialDelay: this.configService.get<number>('RABBITMQ_INITIAL_DELAY', 1000),
      maxDelay: this.configService.get<number>('RABBITMQ_MAX_DELAY', 30000),
      backoffMultiplier: this.configService.get<number>('RABBITMQ_BACKOFF_MULTIPLIER', 2),
      jitter: this.configService.get<boolean>('RABBITMQ_JITTER', true),
    };

    this.deadLetterConfig = {
      enabled: this.configService.get<boolean>('RABBITMQ_DLQ_ENABLED', true),
      exchange: this.configService.get<string>('RABBITMQ_DLQ_EXCHANGE', 'dlq.exchange'),
      routingKey: this.configService.get<string>('RABBITMQ_DLQ_ROUTING_KEY', 'dlq.routing.key'),
      ttl: this.configService.get<number>('RABBITMQ_DLQ_TTL', 86400000), // 24 hours
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', 'amqp://admin:rabbitmq123@localhost:5672');
    
    this.connection = amqpConnectionManager.connect([url], {
      heartbeatIntervalInSeconds: 60,
    });

    this.channel = this.connection.createChannel({
      json: true,
      setup: (channel: amqp.Channel) => {
        return Promise.all([
          channel.assertExchange(this.deadLetterConfig.exchange, 'topic', { durable: true }),
        ]);
      },
    });

    this.connection.on('connect', () => {
      console.log('RabbitMQ connected');
    });

    this.connection.on('disconnect', (params) => {
      console.error('RabbitMQ disconnected', params.err);
    });
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publish(exchange: string, routingKey: string, message: any, options?: PublishOptions): Promise<void> {
    const publishOptions = {
      persistent: options?.persistent ?? true,
      expiration: options?.expiration,
      headers: {
        ...options?.headers,
        'x-retry-count': 0,
      },
      priority: options?.priority,
      delay: options?.delay,
    };

    try {
      await this.channel.publish(exchange, routingKey, message, publishOptions);
    } catch (error) {
      await this.handlePublishError(exchange, routingKey, message, publishOptions, error);
    }
  }

  async subscribe(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
    const queueOptions: QueueOptions = {
      durable: true,
      arguments: this.deadLetterConfig.enabled ? {
        'x-dead-letter-exchange': this.deadLetterConfig.exchange,
        'x-dead-letter-routing-key': `${queue}.dlq`,
        'x-message-ttl': this.deadLetterConfig.ttl,
      } : undefined,
    };

    await this.channel.addSetup(async (channel: amqp.Channel) => {
      await channel.assertQueue(queue, queueOptions);
      await channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          channel.ack(msg);
        } catch (error) {
          await this.handleMessageError(msg, channel, error);
        }
      });
    });
  }

  async createQueue(name: string, options?: QueueOptions): Promise<void> {
    await this.channel.addSetup(async (channel: amqp.Channel) => {
      await channel.assertQueue(name, {
        durable: options?.durable ?? true,
        exclusive: options?.exclusive ?? false,
        autoDelete: options?.autoDelete ?? false,
        arguments: options?.arguments,
      });
    });
  }

  async createExchange(name: string, type: ExchangeType, options?: ExchangeOptions): Promise<void> {
    await this.channel.addSetup(async (channel: amqp.Channel) => {
      await channel.assertExchange(name, type, {
        durable: options?.durable ?? true,
        internal: options?.internal ?? false,
        autoDelete: options?.autoDelete ?? false,
        arguments: options?.arguments,
      });
    });
  }

  private async handlePublishError(
    exchange: string,
    routingKey: string,
    message: any,
    options: any,
    error: any,
  ): Promise<void> {
    const retryCount = options.headers['x-retry-count'] || 0;
    
    if (retryCount < this.retryConfig.maxRetries) {
      const delay = this.calculateRetryDelay(retryCount);
      
      setTimeout(async () => {
        options.headers['x-retry-count'] = retryCount + 1;
        try {
          await this.channel.publish(exchange, routingKey, message, options);
        } catch (retryError) {
          console.error(`Retry ${retryCount + 1} failed for message`, retryError);
        }
      }, delay);
    } else {
      console.error('Max retries exceeded, sending to DLQ', error);
      await this.sendToDeadLetterQueue(exchange, routingKey, message, options);
    }
  }

  private async handleMessageError(msg: amqp.ConsumeMessage, channel: amqp.Channel, error: any): Promise<void> {
    const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
    
    if (retryCount < this.retryConfig.maxRetries) {
      const delay = this.calculateRetryDelay(retryCount);
      
      setTimeout(async () => {
        msg.properties.headers = { ...msg.properties.headers, 'x-retry-count': retryCount + 1 };
        await channel.publish('', msg.fields.routingKey, msg.content, {
          ...msg.properties,
          expiration: delay.toString(),
        });
        channel.ack(msg);
      }, 100);
    } else {
      console.error('Max retries exceeded for consumed message, sending to DLQ', error);
      await this.sendToDeadLetterQueue('', msg.fields.routingKey, JSON.parse(msg.content.toString()), msg.properties);
      channel.ack(msg);
    }
  }

  private calculateRetryDelay(retryCount: number): number {
    let delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
    delay = Math.min(delay, this.retryConfig.maxDelay);
    
    if (this.retryConfig.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  private async sendToDeadLetterQueue(exchange: string, routingKey: string, message: any, options: any): Promise<void> {
    try {
      await this.channel.publish(
        this.deadLetterConfig.exchange,
        this.deadLetterConfig.routingKey,
        {
          originalExchange: exchange,
          originalRoutingKey: routingKey,
          message,
          options,
          timestamp: new Date().toISOString(),
          error: 'Max retries exceeded',
        },
        { persistent: true }
      );
    } catch (error) {
      console.error('Failed to send message to DLQ', error);
    }
  }
}
