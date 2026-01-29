import { Injectable, Logger, Inject } from "@nestjs/common"
import type { ConfigType } from "@nestjs/config"
import type Redis from "ioredis"
import { LRUCache } from "lru-cache"
import { cacheConfig } from "../config/cache.config"
import type { CacheMonitoringService } from "./cache-monitoring.service"

export interface CacheOptions {
  ttl?: number
  tags?: string[] | ((args: any[]) => string[])
  compress?: boolean
  layer?: "l1" | "l2" | "both"
}

export interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  avgResponseTime: number
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private readonly l1Cache: LRUCache<string, any>
  private readonly keyPrefix: string
  private readonly redis: Redis;

  constructor(
    private readonly redisClient: Redis,
    @Inject(cacheConfig.KEY)
    private readonly config: typeof cacheConfig.KEY extends string ? any : any,
    private readonly monitoring: CacheMonitoringService,
  ) {
    this.keyPrefix = this.config.redis.keyPrefix;
    this.redis = this.redisClient;

    // Initialize L1 cache (in-memory)
    this.l1Cache = new LRUCache({
      max: this.config.layers.l1.maxSize,
      ttl: this.config.layers.l1.ttl * 1000,
    });

    this.setupRedisEventHandlers();
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = Date.now()
    const fullKey = this.buildKey(key)

    try {
      // Try L1 cache first if enabled
      if (this.config.layers.l1.enabled && (options.layer === "l1" || options.layer === "both" || !options.layer)) {
        const l1Result = this.l1Cache.get(fullKey)
        if (l1Result !== undefined) {
          this.monitoring.recordHit("l1", Date.now() - startTime)
          return l1Result
        }
      }

      // Try L2 cache (Redis) if enabled
      if (this.config.layers.l2.enabled && (options.layer === "l2" || options.layer === "both" || !options.layer)) {
        const l2Result = await this.redis.get(fullKey)
        if (l2Result !== null) {
          const parsed = this.deserialize(l2Result)

          // Populate L1 cache if enabled
          if (this.config.layers.l1.enabled) {
            this.l1Cache.set(fullKey, parsed)
          }

          this.monitoring.recordHit("l2", Date.now() - startTime)
          return parsed
        }
      }

      this.monitoring.recordMiss(Date.now() - startTime)
      return null
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error)
      this.monitoring.recordError()
      return null
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const startTime = Date.now()
    const fullKey = this.buildKey(key)
    const ttl = options.ttl || this.config.redis.defaultTtl

    try {
      const serialized = this.serialize(value)

      // Set in L1 cache if enabled
      if (this.config.layers.l1.enabled && (options.layer === "l1" || options.layer === "both" || !options.layer)) {
        this.l1Cache.set(fullKey, value)
      }

      // Set in L2 cache (Redis) if enabled
      if (this.config.layers.l2.enabled && (options.layer === "l2" || options.layer === "both" || !options.layer)) {
        await this.redis.setex(fullKey, ttl, serialized)

        // Add tags for invalidation
        if (options.tags && options.tags.length > 0) {
          await this.addTags(fullKey, options.tags)
        }
      }

      this.monitoring.recordSet(Date.now() - startTime)
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error)
      this.monitoring.recordError()
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    const startTime = Date.now()
    const fullKey = this.buildKey(key)

    try {
      // Delete from L1 cache
      if (this.config.layers.l1.enabled) {
        this.l1Cache.delete(fullKey)
      }

      // Delete from L2 cache
      if (this.config.layers.l2.enabled) {
        await this.redis.del(fullKey)
        await this.removeTags(fullKey)
      }

      this.monitoring.recordDelete(Date.now() - startTime)
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error)
      this.monitoring.recordError()
      throw error
    }
  }

  async deleteByTag(tag: string): Promise<void> {
    try {
      const tagKey = `${this.keyPrefix}tag:${tag}`
      const keys = await this.redis.smembers(tagKey)

      if (keys.length > 0) {
        // Delete from L1 cache
        if (this.config.layers.l1.enabled) {
          keys.forEach((key: string) => this.l1Cache.delete(key))
        }

        // Delete from L2 cache
        if (this.config.layers.l2.enabled) {
          await this.redis.del(...keys)
          await this.redis.del(tagKey)
        }
      }
    } catch (error) {
      this.logger.error(`Cache deleteByTag error for tag ${tag}:`, error)
      this.monitoring.recordError()
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear L1 cache
      if (this.config.layers.l1.enabled) {
        this.l1Cache.clear()
      }

      // Clear L2 cache
      if (this.config.layers.l2.enabled) {
        const keys = await this.redis.keys(`${this.keyPrefix}*`)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }
    } catch (error) {
      this.logger.error("Cache clear error:", error)
      this.monitoring.recordError()
      throw error
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key)

    try {
      // Check L1 cache first
      if (this.config.layers.l1.enabled && this.l1Cache.has(fullKey)) {
        return true
      }

      // Check L2 cache
      if (this.config.layers.l2.enabled) {
        const exists = await this.redis.exists(fullKey)
        return exists === 1
      }

      return false
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  async getKeys(pattern = "*"): Promise<string[]> {
    try {
      const fullPattern = `${this.keyPrefix}${pattern}`
      return await this.redis.keys(fullPattern)
    } catch (error) {
      this.logger.error(`Cache getKeys error for pattern ${pattern}:`, error)
      return []
    }
  }

  getMetrics(): CacheMetrics {
    return this.monitoring.getMetrics()
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  private serialize(value: any): string {
    return JSON.stringify(value)
  }

  private deserialize(value: string): any {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }

  private async addTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline()

    for (const tag of tags) {
      const tagKey = `${this.keyPrefix}tag:${tag}`
      pipeline.sadd(tagKey, key)
    }

    await pipeline.exec()
  }

  private async removeTags(key: string): Promise<void> {
    const tagKeys = await this.redis.keys(`${this.keyPrefix}tag:*`)

    if (tagKeys.length > 0) {
      const pipeline = this.redis.pipeline()
      tagKeys.forEach((tagKey: string) => pipeline.srem(tagKey, key))
      await pipeline.exec()
    }
  }

  private setupRedisEventHandlers(): void {
    this.redis.on("connect", () => {
      this.logger.log("Redis connected")
    })

    this.redis.on("error", (error: Error) => {
      this.logger.error("Redis error:", error)
      this.monitoring.recordError()
    })

    this.redis.on("close", () => {
      this.logger.warn("Redis connection closed")
    })
  }
}
