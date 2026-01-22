import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { 
  IMessageBroker, 
  PublishOptions, 
  QueueOptions as IQueueOptions,
  RetryConfig,
  DeadLetterConfig
} from '../interfaces';

@Injectable()
export class RedisService implements IMessageBroker, OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private readonly retryConfig: RetryConfig;
  private readonly deadLetterConfig: DeadLetterConfig;

  constructor(private readonly configService: ConfigService) {
    this.retryConfig = {
      maxRetries: this.configService.get<number>('REDIS_MAX_RETRIES', 3),
      initialDelay: this.configService.get<number>('REDIS_INITIAL_DELAY', 1000),
      maxDelay: this.configService.get<number>('REDIS_MAX_DELAY', 30000),
      backoffMultiplier: this.configService.get<number>('REDIS_BACKOFF_MULTIPLIER', 2),
      jitter: this.configService.get<boolean>('REDIS_JITTER', true),
    };

    this.deadLetterConfig = {
      enabled: this.configService.get<boolean>('REDIS_DLQ_ENABLED', true),
      exchange: this.configService.get<string>('REDIS_DLQ_EXCHANGE', 'dlq'),
      routingKey: this.configService.get<string>('REDIS_DLQ_ROUTING_KEY', 'dlq'),
      ttl: this.configService.get<number>('REDIS_DLQ_TTL', 86400000),
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://:redis123@localhost:6379');
    
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      console.log('Redis connected');
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error', error);
    });

    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    // Close all workers
    for (const [name, worker] of this.workers) {
      await worker.close();
    }
    this.workers.clear();

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
    }
    this.queues.clear();

    // Close Redis connection
    if (this.redis) {
      await this.redis.disconnect();
    }
  }

  async publish(exchange: string, routingKey: string, message: any, options?: PublishOptions): Promise<void> {
    const queueName = `${exchange}.${routingKey}`;
    let queue = this.queues.get(queueName);

    if (!queue) {
      queue = await this.createQueueInternal(queueName);
    }

    const jobOptions = {
      attempts: this.retryConfig.maxRetries + 1,
      backoff: {
        type: 'exponential',
        delay: this.retryConfig.initialDelay,
      },
      delay: options?.delay,
      removeOnComplete: 100,
      removeOnFail: 50,
      ...options,
    };

    await queue.add('message', message, jobOptions);
  }

  async subscribe(queue: string, handler: (message: any) => Promise<void>): Promise<void> {
    let worker = this.workers.get(queue);

    if (!worker) {
      worker = await this.createWorker(queue, handler);
    }

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} in queue ${queue} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} in queue ${queue} failed:`, err);
      if (this.deadLetterConfig.enabled && job?.attemptsMade >= this.retryConfig.maxRetries) {
        this.sendToDeadLetterQueue(queue, job.data, err);
      }
    });
  }

  async createQueue(name: string, options?: IQueueOptions): Promise<void> {
    await this.createQueueInternal(name, options);
  }

  async createExchange(name: string, type: string, options?: any): Promise<void> {
    // Redis/BullMQ doesn't have exchanges like RabbitMQ
    // We can simulate exchanges using queue naming conventions
    console.log(`Exchange ${name} of type ${type} simulated with queue naming`);
  }

  private async createQueueInternal(name: string, options?: IQueueOptions): Promise<Queue> {
    const connectionOptions = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', 'redis123'),
    };

    const queueOptions: QueueOptions = {
      connection: connectionOptions,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: this.retryConfig.maxRetries + 1,
        backoff: {
          type: 'exponential',
          delay: this.retryConfig.initialDelay,
        },
      },
      ...options,
    };

    const queue = new Queue(name, queueOptions);
    this.queues.set(name, queue);

    // Create dead letter queue if enabled
    if (this.deadLetterConfig.enabled) {
      const dlqName = `${name}.dlq`;
      const dlq = new Queue(dlqName, {
        connection: connectionOptions,
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 1000,
        },
      });
      this.queues.set(dlqName, dlq);
    }

    return queue;
  }

  private async createWorker(queue: string, handler: (message: any) => Promise<void>): Promise<Worker> {
    const connectionOptions = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', 'redis123'),
    };

    const workerOptions: WorkerOptions = {
      connection: connectionOptions,
      concurrency: 5,
    };

    const worker = new Worker(queue, async (job) => {
      await handler(job.data);
    }, workerOptions);

    this.workers.set(queue, worker);
    return worker;
  }

  private async sendToDeadLetterQueue(queue: string, message: any, error: any): Promise<void> {
    if (!this.deadLetterConfig.enabled) return;

    const dlqName = `${queue}.dlq`;
    let dlq = this.queues.get(dlqName);

    if (!dlq) {
      dlq = await this.createQueueInternal(dlqName);
    }

    await dlq.add('dead-letter', {
      originalQueue: queue,
      message,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
