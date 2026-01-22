import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMessageBroker, PublishOptions, QueueOptions as IQueueOptions } from '../interfaces';
export declare class RedisService implements IMessageBroker, OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private redis;
    private queues;
    private workers;
    private readonly retryConfig;
    private readonly deadLetterConfig;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(exchange: string, routingKey: string, message: any, options?: PublishOptions): Promise<void>;
    subscribe(queue: string, handler: (message: any) => Promise<void>): Promise<void>;
    createQueue(name: string, options?: IQueueOptions): Promise<void>;
    createExchange(name: string, type: string, options?: any): Promise<void>;
    private createQueueInternal;
    private createWorker;
    private sendToDeadLetterQueue;
}
