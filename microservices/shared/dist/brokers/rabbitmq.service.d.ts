import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMessageBroker, PublishOptions, QueueOptions, ExchangeOptions, ExchangeType } from '../interfaces';
export declare class RabbitMQService implements IMessageBroker, OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private connection;
    private channel;
    private readonly retryConfig;
    private readonly deadLetterConfig;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(exchange: string, routingKey: string, message: any, options?: PublishOptions): Promise<void>;
    subscribe(queue: string, handler: (message: any) => Promise<void>): Promise<void>;
    createQueue(name: string, options?: QueueOptions): Promise<void>;
    createExchange(name: string, type: ExchangeType, options?: ExchangeOptions): Promise<void>;
    private handlePublishError;
    private handleMessageError;
    private calculateRetryDelay;
    private sendToDeadLetterQueue;
}
