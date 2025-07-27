import { Controller, Get, Header } from "@nestjs/common"
import type { MetricsService } from "../services/metrics.service"
import type { PerformanceService } from "../services/performance.service"
import type { AlertingService } from "../services/alerting.service"

@Controller("metrics")
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly performanceService: PerformanceService,
    private readonly alertingService: AlertingService,
  ) {}

  @Get()
  @Header("Content-Type", "text/plain")
  async getMetrics() {
    return this.metricsService.getMetrics()
  }

  @Get("json")
  async getMetricsJSON() {
    return this.metricsService.getMetricsJSON()
  }

  @Get("performance")
  async getPerformanceMetrics() {
    return {
      recent: this.performanceService.getMetrics(undefined, 50),
      stats: {
        httpRequests: this.performanceService.getPerformanceStats("http_request"),
        databaseQueries: this.performanceService.getPerformanceStats("database_query"),
        cacheOperations: this.performanceService.getPerformanceStats("cache_operation"),
      },
    }
  }

  @Get("alerts")
  async getActiveAlerts() {
    return {
      active: this.alertingService.getActiveAlerts(),
      total: this.alertingService.getActiveAlerts().length,
    }
  }
}
