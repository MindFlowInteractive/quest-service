export interface CacheKey {
  prefix: string
  identifier: string
  version?: string
}

export interface CacheEntry<T = any> {
  value: T
  createdAt: Date
  expiresAt?: Date
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CacheStats {
  totalKeys: number
  memoryUsage: number
  hitRate: number
  missRate: number
  evictionCount: number
}

export interface CacheHealth {
  status: "healthy" | "degraded" | "unhealthy"
  redis: {
    connected: boolean
    latency: number
    memoryUsage: number
  }
  l1Cache: {
    size: number
    hitRate: number
  }
  lastCheck: Date
}

export enum CacheEvent {
  HIT = "cache.hit",
  MISS = "cache.miss",
  SET = "cache.set",
  DELETE = "cache.delete",
  EVICT = "cache.evict",
  ERROR = "cache.error",
}
