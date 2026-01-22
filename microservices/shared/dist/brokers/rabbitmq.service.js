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
exports.RabbitMQService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqpConnectionManager = require("amqp-connection-manager");
let RabbitMQService = class RabbitMQService {
    constructor(configService) {
        this.configService = configService;
        this.retryConfig = {
            maxRetries: this.configService.get('RABBITMQ_MAX_RETRIES', 3),
            initialDelay: this.configService.get('RABBITMQ_INITIAL_DELAY', 1000),
            maxDelay: this.configService.get('RABBITMQ_MAX_DELAY', 30000),
            backoffMultiplier: this.configService.get('RABBITMQ_BACKOFF_MULTIPLIER', 2),
            jitter: this.configService.get('RABBITMQ_JITTER', true),
        };
        this.deadLetterConfig = {
            enabled: this.configService.get('RABBITMQ_DLQ_ENABLED', true),
            exchange: this.configService.get('RABBITMQ_DLQ_EXCHANGE', 'dlq.exchange'),
            routingKey: this.configService.get('RABBITMQ_DLQ_ROUTING_KEY', 'dlq.routing.key'),
            ttl: this.configService.get('RABBITMQ_DLQ_TTL', 86400000),
        };
    }
    async onModuleInit() {
        await this.connect();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        const url = this.configService.get('RABBITMQ_URL', 'amqp://admin:rabbitmq123@localhost:5672');
        this.connection = amqpConnectionManager.connect([url], {
            heartbeatIntervalInSeconds: 60,
        });
        this.channel = this.connection.createChannel({
            json: true,
            setup: (channel) => {
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
    async disconnect() {
        if (this.channel) {
            await this.channel.close();
        }
        if (this.connection) {
            await this.connection.close();
        }
    }
    async publish(exchange, routingKey, message, options) {
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
        }
        catch (error) {
            await this.handlePublishError(exchange, routingKey, message, publishOptions, error);
        }
    }
    async subscribe(queue, handler) {
        const queueOptions = {
            durable: true,
            arguments: this.deadLetterConfig.enabled ? {
                'x-dead-letter-exchange': this.deadLetterConfig.exchange,
                'x-dead-letter-routing-key': `${queue}.dlq`,
                'x-message-ttl': this.deadLetterConfig.ttl,
            } : undefined,
        };
        await this.channel.addSetup(async (channel) => {
            await channel.assertQueue(queue, queueOptions);
            await channel.consume(queue, async (msg) => {
                if (!msg)
                    return;
                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content);
                    channel.ack(msg);
                }
                catch (error) {
                    await this.handleMessageError(msg, channel, error);
                }
            });
        });
    }
    async createQueue(name, options) {
        await this.channel.addSetup(async (channel) => {
            await channel.assertQueue(name, {
                durable: options?.durable ?? true,
                exclusive: options?.exclusive ?? false,
                autoDelete: options?.autoDelete ?? false,
                arguments: options?.arguments,
            });
        });
    }
    async createExchange(name, type, options) {
        await this.channel.addSetup(async (channel) => {
            await channel.assertExchange(name, type, {
                durable: options?.durable ?? true,
                internal: options?.internal ?? false,
                autoDelete: options?.autoDelete ?? false,
                arguments: options?.arguments,
            });
        });
    }
    async handlePublishError(exchange, routingKey, message, options, error) {
        const retryCount = options.headers['x-retry-count'] || 0;
        if (retryCount < this.retryConfig.maxRetries) {
            const delay = this.calculateRetryDelay(retryCount);
            setTimeout(async () => {
                options.headers['x-retry-count'] = retryCount + 1;
                try {
                    await this.channel.publish(exchange, routingKey, message, options);
                }
                catch (retryError) {
                    console.error(`Retry ${retryCount + 1} failed for message`, retryError);
                }
            }, delay);
        }
        else {
            console.error('Max retries exceeded, sending to DLQ', error);
            await this.sendToDeadLetterQueue(exchange, routingKey, message, options);
        }
    }
    async handleMessageError(msg, channel, error) {
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
        }
        else {
            console.error('Max retries exceeded for consumed message, sending to DLQ', error);
            await this.sendToDeadLetterQueue('', msg.fields.routingKey, JSON.parse(msg.content.toString()), msg.properties);
            channel.ack(msg);
        }
    }
    calculateRetryDelay(retryCount) {
        let delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
        delay = Math.min(delay, this.retryConfig.maxDelay);
        if (this.retryConfig.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }
        return Math.floor(delay);
    }
    async sendToDeadLetterQueue(exchange, routingKey, message, options) {
        try {
            await this.channel.publish(this.deadLetterConfig.exchange, this.deadLetterConfig.routingKey, {
                originalExchange: exchange,
                originalRoutingKey: routingKey,
                message,
                options,
                timestamp: new Date().toISOString(),
                error: 'Max retries exceeded',
            }, { persistent: true });
        }
        catch (error) {
            console.error('Failed to send message to DLQ', error);
        }
    }
};
exports.RabbitMQService = RabbitMQService;
exports.RabbitMQService = RabbitMQService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RabbitMQService);
//# sourceMappingURL=rabbitmq.service.js.map