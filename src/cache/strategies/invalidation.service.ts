import { Injectable, Logger } from "@nestjs/common"
import type { CacheService } from "../services/cache.service"

export interface InvalidationRule {
  pattern: string
  tags?: string[]
  condition?: () => boolean
}

@Injectable()
export class InvalidationService {
  private readonly logger = new Logger(InvalidationService.name)
  private rules: Map<string, InvalidationRule> = new Map()

  constructor(private readonly cacheService: CacheService) {}

  registerRule(name: string, rule: InvalidationRule): void {
    this.rules.set(name, rule)
    this.logger.log(`Registered invalidation rule: ${name}`)
  }

  async invalidateByRule(ruleName: string): Promise<void> {
    const rule = this.rules.get(ruleName)
    if (!rule) {
      this.logger.warn(`Invalidation rule not found: ${ruleName}`)
      return
    }

    try {
      if (rule.condition && !rule.condition()) {
        this.logger.debug(`Invalidation rule condition not met: ${ruleName}`)
        return
      }

      // Invalidate by pattern
      if (rule.pattern) {
        const keys = await this.cacheService.getKeys(rule.pattern)
        for (const key of keys) {
          await this.cacheService.delete(key.replace(process.env.CACHE_KEY_PREFIX || "app:", ""))
        }
      }

      // Invalidate by tags
      if (rule.tags) {
        for (const tag of rule.tags) {
          await this.cacheService.deleteByTag(tag)
        }
      }

      this.logger.log(`Cache invalidated using rule: ${ruleName}`)
    } catch (error) {
      this.logger.error(`Error invalidating cache with rule ${ruleName}:`, error)
      throw error
    }
  }

  async invalidateByEntity(entityName: string, entityId?: string): Promise<void> {
    try {
      const pattern = entityId ? `${entityName}:${entityId}*` : `${entityName}:*`
      const keys = await this.cacheService.getKeys(pattern)

      for (const key of keys) {
        await this.cacheService.delete(key.replace(process.env.CACHE_KEY_PREFIX || "app:", ""))
      }

      // Also invalidate by tag
      await this.cacheService.deleteByTag(entityName)
      if (entityId) {
        await this.cacheService.deleteByTag(`${entityName}:${entityId}`)
      }

      this.logger.log(`Cache invalidated for entity: ${entityName}${entityId ? `:${entityId}` : ""}`)
    } catch (error) {
      this.logger.error(`Error invalidating cache for entity ${entityName}:`, error)
      throw error
    }
  }

  async invalidateByUser(userId: string): Promise<void> {
    await this.invalidateByEntity("user", userId)
    await this.cacheService.deleteByTag(`user:${userId}`)
  }

  async invalidateAll(): Promise<void> {
    try {
      await this.cacheService.clear()
      this.logger.log("All cache invalidated")
    } catch (error) {
      this.logger.error("Error invalidating all cache:", error)
      throw error
    }
  }
}
