import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { EventPublisher } from './event-publisher';
import { EventSubscriber } from './event-subscriber';
import { EventBusConfig } from './event-bus.config';
import { EVENT_HANDLER_METADATA } from './decorators/event-handler.decorator';
import { EventHandlerConfig } from '../types/event.types';

@Module({})
export class EventBusModule implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly eventSubscriber: EventSubscriber,
  ) {}

  /**
   * Register event bus with configuration
   */
  static register(config: EventBusConfig): DynamicModule {
    return {
      module: EventBusModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: 'EVENT_BUS_CONFIG',
          useValue: config,
        },
        {
          provide: EventPublisher,
          useFactory: () => new EventPublisher(config),
        },
        {
          provide: EventSubscriber,
          useFactory: () => new EventSubscriber(config),
        },
      ],
      exports: [EventPublisher, EventSubscriber],
      global: true,
    };
  }

  /**
   * Discover and register all event handlers on module initialization
   */
  async onModuleInit(): Promise<void> {
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') {
        continue;
      }

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const config = this.reflector.get<EventHandlerConfig>(
          EVENT_HANDLER_METADATA,
          instance[methodName],
        );

        if (config) {
          const handler = instance[methodName].bind(instance);
          await this.eventSubscriber.subscribe(config, handler);
        }
      }
    }
  }
}
