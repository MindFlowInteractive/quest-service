import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEventPublisher, IEvent, IEventHandler } from '../interfaces';
import { BaseEvent } from '../events';

export const EVENT_HANDLER_METADATA = 'event_handler';

export function EventHandler(eventType: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(EVENT_HANDLER_METADATA, eventType, descriptor.value);
  };
}

@Injectable()
export class EventBusService implements IEventPublisher, OnModuleInit {
  private handlers: Map<string, IEventHandler[]> = new Map();
  private eventStore: IEvent[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    console.log('EventBus initialized');
  }

  async publish<T extends IEvent>(event: T): Promise<void> {
    this.eventStore.push(event);
    
    const handlers = this.handlers.get(event.eventType) || [];
    
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler.handle(event);
        } catch (error) {
          console.error(`Error handling event ${event.eventType}:`, error);
          throw error;
        }
      })
    );
  }

  async publishBatch<T extends IEvent>(events: T[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  registerHandler(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    const handlers = this.handlers.get(eventType)!;
    if (!handlers.includes(handler)) {
      handlers.push(handler);
    }
  }

  unregisterHandler(eventType: string, handler: IEventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  getEventStore(): IEvent[] {
    return [...this.eventStore];
  }

  getEventsByType(eventType: string): IEvent[] {
    return this.eventStore.filter(event => event.eventType === eventType);
  }

  getEventsBySource(source: string): IEvent[] {
    return this.eventStore.filter(event => event.source === source);
  }

  clearEventStore(): void {
    this.eventStore = [];
  }
}

@Injectable()
export class EventPublisherService {
  constructor(private readonly eventBus: EventBusService) {}

  async publishEvent(
    eventType: string,
    data: Record<string, any>,
    source: string,
    options?: {
      version?: string;
      correlationId?: string;
      causationId?: string;
    }
  ): Promise<void> {
    const event = new BaseEvent(eventType, data, source, options);
    await this.eventBus.publish(event);
  }

  async publishEvents(events: Array<{
    eventType: string;
    data: Record<string, any>;
    source: string;
    options?: {
      version?: string;
      correlationId?: string;
      causationId?: string;
    };
  }>): Promise<void> {
    const baseEvents = events.map(({ eventType, data, source, options }) =>
      new BaseEvent(eventType, data, source, options)
    );
    await this.eventBus.publishBatch(baseEvents);
  }
}

export interface EventPattern {
  eventType: string;
  version?: string;
  source?: string;
}

export function EventListener(pattern: EventPattern) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const existingPatterns = Reflect.getMetadata('event_patterns', target) || [];
    existingPatterns.push({
      eventType: pattern.eventType,
      version: pattern.version,
      source: pattern.source,
      handler: descriptor.value,
    });
    Reflect.defineMetadata('event_patterns', existingPatterns, target);
  };
}
