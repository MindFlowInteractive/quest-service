import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceDiscovery, ServiceInfo } from '../interfaces';
export declare class RedisServiceDiscovery implements ServiceDiscovery, OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private redis;
    private readonly servicePrefix;
    private readonly heartbeatInterval;
    private readonly serviceTimeout;
    private heartbeatTimers;
    private watchCallbacks;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    register(service: ServiceInfo): Promise<void>;
    unregister(serviceId: string): Promise<void>;
    discover(serviceName: string): Promise<ServiceInfo[]>;
    watch(serviceName: string, callback: (services: ServiceInfo[]) => void): void;
    private startHeartbeat;
    private startWatching;
    private cleanupExpiredServices;
}
export declare class ServiceRegistry {
    private readonly serviceDiscovery;
    constructor(serviceDiscovery: ServiceDiscovery);
    registerService(name: string, host: string, port: number, protocol?: 'http' | 'grpc', metadata?: Record<string, any>): Promise<string>;
    getServiceUrl(serviceName: string, protocol?: 'http' | 'grpc'): Promise<string | null>;
    getHealthyService(serviceName: string): Promise<ServiceInfo | null>;
    private isServiceHealthy;
}
