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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisCacheService = RedisCacheService_1 = class RedisCacheService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisCacheService_1.name);
        this.redis = null;
    }
    async onModuleInit() {
        this.redis = this.createRedisClient();
        try {
            await this.redis.ping();
            this.logger.log('Connected to Redis for cache warming');
        }
        catch (error) {
            this.logger.error('Unable to connect to Redis', error);
            throw error;
        }
    }
    async onModuleDestroy() {
        if (this.redis) {
            await this.redis.quit();
        }
    }
    async setJson(key, value, ttlSeconds) {
        await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }
    async exists(key) {
        return (await this.client.exists(key)) === 1;
    }
    async ttl(key) {
        return this.client.ttl(key);
    }
    async deleteKey(key) {
        return this.client.del(key);
    }
    async deleteKeys(keys) {
        if (keys.length === 0) {
            return 0;
        }
        return this.client.del(...keys);
    }
    async deletePattern(pattern) {
        const stream = this.client.scanStream({ match: pattern, count: 100 });
        const pipeline = this.client.pipeline();
        let found = 0;
        for await (const keys of stream) {
            if (keys.length > 0) {
                keys.forEach((key) => pipeline.del(key));
                found += keys.length;
            }
        }
        if (found > 0) {
            await pipeline.exec();
        }
        return found;
    }
    async increment(key) {
        return this.client.incr(key);
    }
    async getStats() {
        const [sharedHits, sharedMisses, warmingHits, warmingMisses] = await this.client.mget('cache:hits', 'cache:misses', 'cache-warming:hits', 'cache-warming:misses');
        const hits = Number(sharedHits || '0') + Number(warmingHits || '0');
        const misses = Number(sharedMisses || '0') + Number(warmingMisses || '0');
        const total = hits + misses;
        return {
            hits,
            misses,
            hitRate: total > 0 ? hits / total : 0,
            warmingHits: Number(warmingHits || '0'),
            warmingMisses: Number(warmingMisses || '0'),
        };
    }
    createRedisClient() {
        const url = this.configService.get('REDIS_URL');
        const maxRetriesPerRequest = Number(this.configService.get('REDIS_MAX_RETRIES_PER_REQUEST') || '3');
        const baseOptions = {
            enableOfflineQueue: true,
            enableReadyCheck: true,
            maxRetriesPerRequest,
            retryStrategy: (times) => Math.min(times * 100, 2000),
        };
        if (url) {
            return new ioredis_1.default(url, baseOptions);
        }
        const password = this.configService.get('REDIS_PASSWORD');
        return new ioredis_1.default({
            ...baseOptions,
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: Number(this.configService.get('REDIS_PORT') || '6379'),
            password: password || undefined,
        });
    }
    get client() {
        if (!this.redis) {
            throw new Error('Redis client has not been initialized');
        }
        return this.redis;
    }
};
exports.RedisCacheService = RedisCacheService;
exports.RedisCacheService = RedisCacheService = RedisCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisCacheService);
//# sourceMappingURL=redis-cache.service.js.map