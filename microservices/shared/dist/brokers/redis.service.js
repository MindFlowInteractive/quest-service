"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.queues = new Map();
        this.workers = new Map();
        this.retryConfig = {
            maxRetries: this.configService.get('REDIS_MAX_RETRIES', 3),
            initialDelay: this.configService.get('REDIS_INITIAL_DELAY', 1000),
            maxDelay: this.configService.get('REDIS_MAX_DELAY', 30000),
            backoffMultiplier: this.configService.get('REDIS_BACKOFF_MULTIPLIER', 2),
            jitter: this.configService.get('REDIS_JITTER', true),
        };
        this.deadLetterConfig = {
            enabled: this.configService.get('REDIS_DLQ_ENABLED', true),
            exchange: this.configService.get('REDIS_DLQ_EXCHANGE', 'dlq'),
            routingKey: this.configService.get('REDIS_DLQ_ROUTING_KEY', 'dlq'),
            ttl: this.configService.get('REDIS_DLQ_TTL', 86400000),
        };
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://:redis123@localhost:6379');
        this.redis = new ioredis_1.Redis(redisUrl, {
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
    async disconnect() {
        for (const [name, worker] of this.workers) {
            await worker.close();
        }
        this.workers.clear();
        for (const [name, queue] of this.queues) {
            await queue.close();
        }
        this.queues.clear();
        if (this.redis) {
            await this.redis.disconnect();
        }
    }
    async publish(exchange, routingKey, message, options) {
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
    async subscribe(queue, handler) {
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
    async createQueue(name, options) {
        await this.createQueueInternal(name, options);
    }
    async createExchange(name, type, options) {
        console.log(`Exchange ${name} of type ${type} simulated with queue naming`);
    }
    async createQueueInternal(name, options) {
        const connectionOptions = {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD', 'redis123'),
        };
        const queueOptions = {
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
        const queue = new bullmq_1.Queue(name, queueOptions);
        this.queues.set(name, queue);
        if (this.deadLetterConfig.enabled) {
            const dlqName = `${name}.dlq`;
            const dlq = new bullmq_1.Queue(dlqName, {
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
    async createWorker(queue, handler) {
        const connectionOptions = {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD', 'redis123'),
        };
        const workerOptions = {
            connection: connectionOptions,
            concurrency: 5,
        };
        const worker = new bullmq_1.Worker(queue, async (job) => {
            await handler(job.data);
        }, workerOptions);
        this.workers.set(queue, worker);
        return worker;
    }
    async sendToDeadLetterQueue(queue, message, error) {
        if (!this.deadLetterConfig.enabled)
            return;
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
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map