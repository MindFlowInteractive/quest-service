import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface RedisCacheStats {
    hits: number;
    misses: number;
    hitRate: number;
    warmingHits: number;
    warmingMisses: number;
}
export declare class RedisCacheService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private redis;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    setJson(key: string, value: unknown, ttlSeconds: number): Promise<void>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    deleteKey(key: string): Promise<number>;
    deleteKeys(keys: string[]): Promise<number>;
    deletePattern(pattern: string): Promise<number>;
    increment(key: string): Promise<number>;
    getStats(): Promise<RedisCacheStats>;
    private createRedisClient;
    private get client();
}
