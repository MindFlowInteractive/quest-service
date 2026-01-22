import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEventPublisher, IEvent, IEventHandler } from '../interfaces';
export declare const EVENT_HANDLER_METADATA = "event_handler";
export declare function EventHandler(eventType: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare class EventBusService implements IEventPublisher, OnModuleInit {
    private readonly configService;
    private handlers;
    private eventStore;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    publish<T extends IEvent>(event: T): Promise<void>;
    publishBatch<T extends IEvent>(events: T[]): Promise<void>;
    registerHandler(eventType: string, handler: IEventHandler): void;
    unregisterHandler(eventType: string, handler: IEventHandler): void;
    getEventStore(): IEvent[];
    getEventsByType(eventType: string): IEvent[];
    getEventsBySource(source: string): IEvent[];
    clearEventStore(): void;
}
export declare class EventPublisherService {
    private readonly eventBus;
    constructor(eventBus: EventBusService);
    publishEvent(eventType: string, data: Record<string, any>, source: string, options?: {
        version?: string;
        correlationId?: string;
        causationId?: string;
    }): Promise<void>;
    publishEvents(events: Array<{
        eventType: string;
        data: Record<string, any>;
        source: string;
        options?: {
            version?: string;
            correlationId?: string;
            causationId?: string;
        };
    }>): Promise<void>;
}
export interface EventPattern {
    eventType: string;
    version?: string;
    source?: string;
}
export declare function EventListener(pattern: EventPattern): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
