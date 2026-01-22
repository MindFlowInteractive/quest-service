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
exports.EventPublisherService = exports.EventBusService = exports.EVENT_HANDLER_METADATA = void 0;
exports.EventHandler = EventHandler;
exports.EventListener = EventListener;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const events_1 = require("../events");
exports.EVENT_HANDLER_METADATA = 'event_handler';
function EventHandler(eventType) {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata(exports.EVENT_HANDLER_METADATA, eventType, descriptor.value);
    };
}
let EventBusService = class EventBusService {
    constructor(configService) {
        this.configService = configService;
        this.handlers = new Map();
        this.eventStore = [];
    }
    async onModuleInit() {
        console.log('EventBus initialized');
    }
    async publish(event) {
        this.eventStore.push(event);
        const handlers = this.handlers.get(event.eventType) || [];
        await Promise.all(handlers.map(async (handler) => {
            try {
                await handler.handle(event);
            }
            catch (error) {
                console.error(`Error handling event ${event.eventType}:`, error);
                throw error;
            }
        }));
    }
    async publishBatch(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
    registerHandler(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        const handlers = this.handlers.get(eventType);
        if (!handlers.includes(handler)) {
            handlers.push(handler);
        }
    }
    unregisterHandler(eventType, handler) {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    getEventStore() {
        return [...this.eventStore];
    }
    getEventsByType(eventType) {
        return this.eventStore.filter(event => event.eventType === eventType);
    }
    getEventsBySource(source) {
        return this.eventStore.filter(event => event.source === source);
    }
    clearEventStore() {
        this.eventStore = [];
    }
};
exports.EventBusService = EventBusService;
exports.EventBusService = EventBusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EventBusService);
let EventPublisherService = class EventPublisherService {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    async publishEvent(eventType, data, source, options) {
        const event = new events_1.BaseEvent(eventType, data, source, options);
        await this.eventBus.publish(event);
    }
    async publishEvents(events) {
        const baseEvents = events.map(({ eventType, data, source, options }) => new events_1.BaseEvent(eventType, data, source, options));
        await this.eventBus.publishBatch(baseEvents);
    }
};
exports.EventPublisherService = EventPublisherService;
exports.EventPublisherService = EventPublisherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [EventBusService])
], EventPublisherService);
function EventListener(pattern) {
    return function (target, propertyKey, descriptor) {
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
//# sourceMappingURL=event-bus.service.js.map