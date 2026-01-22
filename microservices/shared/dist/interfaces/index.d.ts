export interface IEvent {
    id: string;
    timestamp: Date;
    eventType: string;
    version: string;
    source: string;
    data: Record<string, any>;
    correlationId?: string;
    causationId?: string;
}
export interface IEventHandler<T extends IEvent = IEvent> {
    handle(event: T): Promise<void>;
}
export interface IEventPublisher {
    publish<T extends IEvent>(event: T): Promise<void>;
    publishBatch<T extends IEvent>(events: T[]): Promise<void>;
}
export interface IMessageBroker {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish(exchange: string, routingKey: string, message: any, options?: PublishOptions): Promise<void>;
    subscribe(queue: string, handler: MessageHandler): Promise<void>;
    createQueue(name: string, options?: QueueOptions): Promise<void>;
    createExchange(name: string, type: ExchangeType, options?: ExchangeOptions): Promise<void>;
}
export interface PublishOptions {
    persistent?: boolean;
    expiration?: string;
    headers?: Record<string, any>;
    priority?: number;
    delay?: number;
}
export interface QueueOptions {
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
    arguments?: Record<string, any>;
}
export interface ExchangeOptions {
    durable?: boolean;
    internal?: boolean;
    autoDelete?: boolean;
    arguments?: Record<string, any>;
}
export type ExchangeType = 'direct' | 'topic' | 'fanout' | 'headers';
export interface MessageHandler {
    (message: any): Promise<void>;
}
export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
}
export interface DeadLetterConfig {
    enabled: boolean;
    exchange: string;
    routingKey: string;
    ttl?: number;
}
export interface ServiceDiscovery {
    register(service: ServiceInfo): Promise<void>;
    unregister(serviceId: string): Promise<void>;
    discover(serviceName: string): Promise<ServiceInfo[]>;
    watch(serviceName: string, callback: (services: ServiceInfo[]) => void): void;
}
export interface ServiceInfo {
    id: string;
    name: string;
    host: string;
    port: number;
    protocol: 'http' | 'grpc';
    healthCheckUrl?: string;
    metadata?: Record<string, any>;
    lastSeen: Date;
}
export interface GrpcServiceOptions {
    package: string;
    protoPath: string;
    url: string;
    credentials?: any;
}
export interface EventBusConfig {
    broker: 'rabbitmq' | 'redis';
    connectionUrl: string;
    retryConfig?: RetryConfig;
    deadLetterConfig?: DeadLetterConfig;
    defaultExchange?: string;
    serviceDiscovery?: ServiceDiscovery;
}
