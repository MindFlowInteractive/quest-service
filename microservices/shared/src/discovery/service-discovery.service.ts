import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ServiceDiscovery, ServiceInfo } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RedisServiceDiscovery implements ServiceDiscovery, OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly servicePrefix = 'service:';
  private readonly heartbeatInterval = 30000; // 30 seconds
  private readonly serviceTimeout = 90000; // 90 seconds
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private watchCallbacks: Map<string, ((services: ServiceInfo[]) => void)[]> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://:redis123@localhost:6379');
    
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
    });

    await this.redis.connect();
    
    // Start cleanup interval for expired services
    setInterval(() => {
      this.cleanupExpiredServices();
    }, this.heartbeatInterval);
  }

  async onModuleDestroy() {
    // Clear all heartbeat timers
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();

    // Unregister all services
    const services = await this.redis.keys(`${this.servicePrefix}*`);
    for (const serviceKey of services) {
      const serviceId = serviceKey.replace(this.servicePrefix, '');
      await this.unregister(serviceId);
    }

    await this.redis.disconnect();
  }

  async register(service: ServiceInfo): Promise<void> {
    const serviceKey = `${this.servicePrefix}${service.id}`;
    const serviceData = JSON.stringify({
      ...service,
      lastSeen: new Date().toISOString(),
    });

    await this.redis.setex(serviceKey, Math.floor(this.serviceTimeout / 1000), serviceData);
    
    // Start heartbeat for this service
    this.startHeartbeat(service);
    
    console.log(`Service registered: ${service.name} (${service.id})`);
  }

  async unregister(serviceId: string): Promise<void> {
    const serviceKey = `${this.servicePrefix}${serviceId}`;
    await this.redis.del(serviceKey);
    
    // Stop heartbeat for this service
    const timer = this.heartbeatTimers.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(serviceId);
    }
    
    console.log(`Service unregistered: ${serviceId}`);
  }

  async discover(serviceName: string): Promise<ServiceInfo[]> {
    const serviceKeys = await this.redis.keys(`${this.servicePrefix}*`);
    const services: ServiceInfo[] = [];

    for (const serviceKey of serviceKeys) {
      const serviceData = await this.redis.get(serviceKey);
      if (serviceData) {
        const service: ServiceInfo = JSON.parse(serviceData);
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

  watch(serviceName: string, callback: (services: ServiceInfo[]) => void): void {
    if (!this.watchCallbacks.has(serviceName)) {
      this.watchCallbacks.set(serviceName, []);
    }
    
    this.watchCallbacks.get(serviceName)!.push(callback);
    
    // Start watching for changes
    this.startWatching(serviceName);
  }

  private async startHeartbeat(service: ServiceInfo): Promise<void> {
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

  private async startWatching(serviceName: string): Promise<void> {
    const checkInterval = setInterval(async () => {
      const services = await this.discover(serviceName);
      const callbacks = this.watchCallbacks.get(serviceName) || [];
      
      for (const callback of callbacks) {
        callback(services);
      }
    }, this.heartbeatInterval);

    // Store interval for cleanup (simplified for this example)
    this.watchCallbacks.set(`${serviceName}_interval`, [() => clearInterval(checkInterval)] as any);
  }

  private async cleanupExpiredServices(): Promise<void> {
    const serviceKeys = await this.redis.keys(`${this.servicePrefix}*`);
    const now = Date.now();

    for (const serviceKey of serviceKeys) {
      const serviceData = await this.redis.get(serviceKey);
      if (serviceData) {
        const service: ServiceInfo = JSON.parse(serviceData);
        const lastSeen = new Date(service.lastSeen).getTime();
        
        if (now - lastSeen > this.serviceTimeout) {
          await this.redis.del(serviceKey);
          console.log(`Cleaned up expired service: ${service.id}`);
        }
      }
    }
  }
}

@Injectable()
export class ServiceRegistry {
  constructor(private readonly serviceDiscovery: ServiceDiscovery) {}

  async registerService(
    name: string,
    host: string,
    port: number,
    protocol: 'http' | 'grpc' = 'http',
    metadata?: Record<string, any>
  ): Promise<string> {
    const serviceId = uuidv4();
    const service: ServiceInfo = {
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

  async getServiceUrl(serviceName: string, protocol?: 'http' | 'grpc'): Promise<string | null> {
    const services = await this.serviceDiscovery.discover(serviceName);
    
    const filteredServices = protocol 
      ? services.filter(s => s.protocol === protocol)
      : services;

    if (filteredServices.length === 0) {
      return null;
    }

    // Simple load balancing - return first available service
    const service = filteredServices[0];
    return `${service.protocol}://${service.host}:${service.port}`;
  }

  async getHealthyService(serviceName: string): Promise<ServiceInfo | null> {
    const services = await this.serviceDiscovery.discover(serviceName);
    
    for (const service of services) {
      if (await this.isServiceHealthy(service)) {
        return service;
      }
    }
    
    return null;
  }

  private async isServiceHealthy(service: ServiceInfo): Promise<boolean> {
    if (!service.healthCheckUrl) {
      return true; // Assume healthy if no health check URL
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
    } catch {
      return false;
    }
  }
}
