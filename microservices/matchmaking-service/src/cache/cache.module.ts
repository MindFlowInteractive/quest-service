import { Module, Global } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { RedisModule } from "@nestjs-modules/ioredis"
import { CacheService } from "./services/cache.service"
import { CacheWarmingService } from "./services/cache-warming.service"
import { CacheMonitoringService } from "./services/cache-monitoring.service"
import { CacheBackupService } from "./services/cache-backup.service"
import { InvalidationService } from "./strategies/invalidation.service"
import { cacheConfig } from "./config/cache.config"

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(cacheConfig),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: "single",
        url: process.env.REDIS_URL || "redis://localhost:6379",
        options: {
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          keepAlive: 30000,
          connectTimeout: 10000,
          commandTimeout: 5000,
        },
      }),
    }),
  ],
  providers: [CacheService, CacheWarmingService, CacheMonitoringService, CacheBackupService, InvalidationService],
  exports: [CacheService, CacheWarmingService, CacheMonitoringService, CacheBackupService, InvalidationService],
})
export class CacheModule {}
