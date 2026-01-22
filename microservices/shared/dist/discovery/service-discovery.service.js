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
exports.ServiceRegistry = exports.RedisServiceDiscovery = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
const uuid_1 = require("uuid");
let RedisServiceDiscovery = class RedisServiceDiscovery {
    constructor(configService) {
        this.configService = configService;
        this.servicePrefix = 'service:';
        this.heartbeatInterval = 30000;
        this.serviceTimeout = 90000;
        this.heartbeatTimers = new Map();
        this.watchCallbacks = new Map();
    }
    async onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL', 'redis://:redis123@localhost:6379');
        this.redis = new ioredis_1.Redis(redisUrl, {
            lazyConnect: true,
        });
        await this.redis.connect();
        setInterval(() => {
            this.cleanupExpiredServices();
        }, this.heartbeatInterval);
    }
    async onModuleDestroy() {
        for (const timer of this.heartbeatTimers.values()) {
            clearInterval(timer);
        }
        this.heartbeatTimers.clear();
        const services = await this.redis.keys(`${this.servicePrefix}*`);
        for (const serviceKey of services) {
            const serviceId = serviceKey.replace(this.servicePrefix, '');
            await this.unregister(serviceId);
        }
        await this.redis.disconnect();
    }
    async register(service) {
        const serviceKey = `${this.servicePrefix}${service.id}`;
        const serviceData = JSON.stringify({
            ...service,
            lastSeen: new Date().toISOString(),
        });
        await this.redis.setex(serviceKey, Math.floor(this.serviceTimeout / 1000), serviceData);
        this.startHeartbeat(service);
        console.log(`Service registered: ${service.name} (${service.id})`);
    }
    async unregister(serviceId) {
        const serviceKey = `${this.servicePrefix}${serviceId}`;
        await this.redis.del(serviceKey);
        const timer = this.heartbeatTimers.get(serviceId);
        if (timer) {
            clearInterval(timer);
            this.heartbeatTimers.delete(serviceId);
        }
        console.log(`Service unregistered: ${serviceId}`);
    }
    async discover(serviceName) {
        const serviceKeys = await this.redis.keys(`${this.servicePrefix}*`);
        const services = [];
        for (const serviceKey of serviceKeys) {
            const serviceData = await this.redis.get(serviceKey);
            if (serviceData) {
                const service = JSON.parse(serviceData);
                if (service.name === serviceName) {
                    services.push({
                        ...service,
                        lastSeen: new Date(service.lastSeen),
                    });
                }
            }
        }
        return services;
    }
    watch(serviceName, callback) {
        if (!this.watchCallbacks.has(serviceName)) {
            this.watchCallbacks.set(serviceName, []);
        }
        this.watchCallbacks.get(serviceName).push(callback);
        this.startWatching(serviceName);
    }
    async startHeartbeat(service) {
        const timer = setInterval(async () => {
            const serviceKey = `${this.servicePrefix}${service.id}`;
            const serviceData = JSON.stringify({
                ...service,
                lastSeen: new Date().toISOString(),
            });
            await this.redis.setex(serviceKey, Math.floor(this.serviceTimeout / 1000), serviceData);
        }, this.heartbeatInterval);
        this.heartbeatTimers.set(service.id, timer);
    }
    async startWatching(serviceName) {
        const checkInterval = setInterval(async () => {
            const services = await this.discover(serviceName);
            const callbacks = this.watchCallbacks.get(serviceName) || [];
            for (const callback of callbacks) {
                callback(services);
            }
        }, this.heartbeatInterval);
        this.watchCallbacks.set(`${serviceName}_interval`, [() => clearInterval(checkInterval)]);
    }
    async cleanupExpiredServices() {
        const serviceKeys = await this.redis.keys(`${this.servicePrefix}*`);
        const now = Date.now();
        for (const serviceKey of serviceKeys) {
            const serviceData = await this.redis.get(serviceKey);
            if (serviceData) {
                const service = JSON.parse(serviceData);
                const lastSeen = new Date(service.lastSeen).getTime();
                if (now - lastSeen > this.serviceTimeout) {
                    await this.redis.del(serviceKey);
                    console.log(`Cleaned up expired service: ${service.id}`);
                }
            }
        }
    }
};
exports.RedisServiceDiscovery = RedisServiceDiscovery;
exports.RedisServiceDiscovery = RedisServiceDiscovery = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisServiceDiscovery);
let ServiceRegistry = class ServiceRegistry {
    constructor(serviceDiscovery) {
        this.serviceDiscovery = serviceDiscovery;
    }
    async registerService(name, host, port, protocol = 'http', metadata) {
        const serviceId = (0, uuid_1.v4)();
        const service = {
            id: serviceId,
            name,
            host,
            port,
            protocol,
            healthCheckUrl: protocol === 'http' ? `http://${host}:${port}/health` : undefined,
            metadata,
            lastSeen: new Date(),
        };
        await this.serviceDiscovery.register(service);
        return serviceId;
    }
    async getServiceUrl(serviceName, protocol) {
        const services = await this.serviceDiscovery.discover(serviceName);
        const filteredServices = protocol
            ? services.filter(s => s.protocol === protocol)
            : services;
        if (filteredServices.length === 0) {
            return null;
        }
        const service = filteredServices[0];
        return `${service.protocol}://${service.host}:${service.port}`;
    }
    async getHealthyService(serviceName) {
        const services = await this.serviceDiscovery.discover(serviceName);
        for (const service of services) {
            if (await this.isServiceHealthy(service)) {
                return service;
            }
        }
        return null;
    }
    async isServiceHealthy(service) {
        if (!service.healthCheckUrl) {
            return true;
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(service.healthCheckUrl, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response.ok;
        }
        catch {
            return false;
        }
    }
};
exports.ServiceRegistry = ServiceRegistry;
exports.ServiceRegistry = ServiceRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], ServiceRegistry);
//# sourceMappingURL=service-discovery.service.js.map