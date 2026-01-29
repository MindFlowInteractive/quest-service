import { Controller, Get } from "@nestjs/common"
import type { HealthService } from "../services/health.service"
import type { MonitoringService } from "../services/monitoring.service"

@Controller("health")
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get()
  async check() {
    return this.healthService.check()
  }

  @Get("database")
  async checkDatabase() {
    return this.healthService.checkDatabase()
  }

  @Get("memory")
  async checkMemory() {
    return this.healthService.checkMemory()
  }

  @Get("disk")
  async checkDisk() {
    return this.healthService.checkDisk()
  }

  @Get("system")
  async getSystemHealth() {
    return this.monitoringService.getSystemHealth()
  }
}
