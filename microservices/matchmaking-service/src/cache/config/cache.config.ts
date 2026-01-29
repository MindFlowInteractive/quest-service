import { registerAs } from "@nestjs/config"

export interface CacheConfig {
  redis: {
    url: string
    keyPrefix: string
    defaultTtl: number
    maxRetries: number
    retryDelay: number
  }
  layers: {
    l1: {
      enabled: boolean
      maxSize: number
      ttl: number
    }
    l2: {
      enabled: boolean
      ttl: number
    }
  }
  monitoring: {
    enabled: boolean
    metricsInterval: number
    alertThresholds: {
      hitRatio: number
      responseTime: number
      errorRate: number
    }
  }
  backup: {
    enabled: boolean
    interval: number
    retention: number
  }
  warming: {
    enabled: boolean
    strategies: string[]
    batchSize: number
  }
}

export const cacheConfig = registerAs(
  "cache",
  (): CacheConfig => ({
    redis: {
      url: process.env.REDIS_URL || "redis://localhost:6379",
      keyPrefix: process.env.CACHE_KEY_PREFIX || "app:",
      defaultTtl: Number.parseInt(process.env.CACHE_DEFAULT_TTL || "3600"),
      maxRetries: Number.parseInt(process.env.CACHE_MAX_RETRIES || "3"),
      retryDelay: Number.parseInt(process.env.CACHE_RETRY_DELAY || "1000"),
    },
    layers: {
      l1: {
        enabled: process.env.CACHE_L1_ENABLED === "true",
        maxSize: Number.parseInt(process.env.CACHE_L1_MAX_SIZE || "1000"),
        ttl: Number.parseInt(process.env.CACHE_L1_TTL || "300"),
      },
      l2: {
        enabled: process.env.CACHE_L2_ENABLED !== "false",
        ttl: Number.parseInt(process.env.CACHE_L2_TTL || "3600"),
      },
    },
    monitoring: {
      enabled: process.env.CACHE_MONITORING_ENABLED !== "false",
      metricsInterval: Number.parseInt(process.env.CACHE_METRICS_INTERVAL || "60000"),
      alertThresholds: {
        hitRatio: Number.parseFloat(process.env.CACHE_HIT_RATIO_THRESHOLD || "0.8"),
        responseTime: Number.parseInt(process.env.CACHE_RESPONSE_TIME_THRESHOLD || "100"),
        errorRate: Number.parseFloat(process.env.CACHE_ERROR_RATE_THRESHOLD || "0.05"),
      },
    },
    backup: {
      enabled: process.env.CACHE_BACKUP_ENABLED === "true",
      interval: Number.parseInt(process.env.CACHE_BACKUP_INTERVAL || "3600000"),
      retention: Number.parseInt(process.env.CACHE_BACKUP_RETENTION || "7"),
    },
    warming: {
      enabled: process.env.CACHE_WARMING_ENABLED !== "false",
      strategies: (process.env.CACHE_WARMING_STRATEGIES || "popular,recent").split(","),
      batchSize: Number.parseInt(process.env.CACHE_WARMING_BATCH_SIZE || "100"),
    },
  }),
)
