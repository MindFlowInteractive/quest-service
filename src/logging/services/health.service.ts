import { Injectable } from "@nestjs/common"
import type {
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from "@nestjs/terminus"
import { HealthCheck } from "@nestjs/terminus"

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.db.pingCheck("database"),
      () => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024),
      () => this.memory.checkRSS("memory_rss", 150 * 1024 * 1024),
      () => this.disk.checkStorage("storage", { path: "/", thresholdPercent: 0.9 }),
    ])
  }

  @HealthCheck()
  async checkDatabase() {
    return this.health.check([() => this.db.pingCheck("database")])
  }

  @HealthCheck()
  async checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024),
      () => this.memory.checkRSS("memory_rss", 150 * 1024 * 1024),
    ])
  }

  @HealthCheck()
  async checkDisk() {
    return this.health.check([() => this.disk.checkStorage("storage", { path: "/", thresholdPercent: 0.9 })])
  }
}
