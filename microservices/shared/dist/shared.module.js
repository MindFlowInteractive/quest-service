"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rabbitmq_service_1 = require("./brokers/rabbitmq.service");
const redis_service_1 = require("./brokers/redis.service");
const event_bus_service_1 = require("./event-bus/event-bus.service");
const service_discovery_service_1 = require("./discovery/service-discovery.service");
const grpc_client_service_1 = require("./grpc/grpc-client.service");
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            rabbitmq_service_1.RabbitMQService,
            redis_service_1.RedisService,
            event_bus_service_1.EventBusService,
            event_bus_service_1.EventPublisherService,
            service_discovery_service_1.RedisServiceDiscovery,
            service_discovery_service_1.ServiceRegistry,
            grpc_client_service_1.GrpcClientService,
        ],
        exports: [
            rabbitmq_service_1.RabbitMQService,
            redis_service_1.RedisService,
            event_bus_service_1.EventBusService,
            event_bus_service_1.EventPublisherService,
            service_discovery_service_1.RedisServiceDiscovery,
            service_discovery_service_1.ServiceRegistry,
            grpc_client_service_1.GrpcClientService,
        ],
    })
], SharedModule);
//# sourceMappingURL=shared.module.js.map