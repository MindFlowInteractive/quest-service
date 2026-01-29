import { Injectable, Logger, type OnModuleInit } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import type { CacheService } from "./cache.service"

export interface WarmingStrategy {
  name: string
  execute(): Promise<void>
}

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmingService.name)
  private strategies: Map<string, WarmingStrategy> = new Map()

  constructor(private readonly cacheService: CacheService) {}

  onModuleInit() {
    this.registerDefaultStrategies()
  }

  registerStrategy(strategy: WarmingStrategy): void {
    this.strategies.set(strategy.name, strategy)
    this.logger.log(`Registered warming strategy: ${strategy.name}`)
  }

  async warmCache(strategyName?: string): Promise<void> {
    try {
      if (strategyName) {
        const strategy = this.strategies.get(strategyName)
        if (strategy) {
          await strategy.execute()
          this.logger.log(`Cache warmed using strategy: ${strategyName}`)
        } else {
          this.logger.warn(`Strategy not found: ${strategyName}`)
        }
      } else {
        // Execute all strategies
        for (const [name, strategy] of this.strategies) {
          try {
            await strategy.execute()
            this.logger.log(`Cache warmed using strategy: ${name}`)
          } catch (error) {
            this.logger.error(`Error warming cache with strategy ${name}:`, error)
          }
        }
      }
    } catch (error) {
      this.logger.error("Error during cache warming:", error)
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async scheduledWarming(): Promise<void> {
    await this.warmCache()
  }

  private registerDefaultStrategies(): void {
    // Popular data strategy
    this.registerStrategy({
      name: "popular",
      execute: async () => {
        // Implementation would depend on your specific use case
        // Example: Cache most accessed user profiles, products, etc.
        this.logger.log("Executing popular data warming strategy")
      },
    })

    // Recent data strategy
    this.registerStrategy({
      name: "recent",
      execute: async () => {
        // Implementation would depend on your specific use case
        // Example: Cache recently created/updated entities
        this.logger.log("Executing recent data warming strategy")
      },
    })

    // Critical data strategy
    this.registerStrategy({
      name: "critical",
      execute: async () => {
        // Implementation would depend on your specific use case
        // Example: Cache system configuration, user permissions, etc.
        this.logger.log("Executing critical data warming strategy")
      },
    })
  }
}
