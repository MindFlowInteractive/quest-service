import { Injectable, Logger } from "@nestjs/common"
import type { ConfigType } from "@nestjs/config"
import { Cron, CronExpression } from "@nestjs/schedule"
import type { loggingConfig } from "../config/logging.config"
import type { AlertingService } from "./alerting.service"
import type { MetricsService } from "./metrics.service"

export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: Date
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
  }
  services: Record<string, ServiceHealth>
  metrics: {
    requestsPerMinute: number
    errorRate: number
    avgResponseTime: number
  }
}

export interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy"
  lastCheck: Date
  responseTime?: number
  error?: string
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name)
  private healthChecks: Map<string, () => Promise<ServiceHealth>> = new Map()
  private metrics: {
    requests: number[]
    errors: number[]
    responseTimes: number[]
  } = {
      requests: [],
      errors: [],
      responseTimes: [],
    }

  constructor(
    private readonly config: any,
    private readonly alertingService: AlertingService,
    private readonly metricsService: MetricsService,
  ) { }

  registerHealthCheck(name: string, check: () => Promise<ServiceHealth>): void {
    this.healthChecks.set(name, check)
    this.logger.log(`Registered health check: ${name}`)
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const memUsage = process.memoryUsage()
    const totalMemory = require("os").totalmem()

    // Run all health checks
    const services: Record<string, ServiceHealth> = {}
    for (const [name, check] of this.healthChecks) {
      try {
        services[name] = await check()
      } catch (error) {
        services[name] = {
          status: "unhealthy",
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Calculate metrics
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    const recentRequests = this.metrics.requests.filter((timestamp) => timestamp > oneMinuteAgo)
    const recentErrors = this.metrics.errors.filter((timestamp) => timestamp > oneMinuteAgo)
    const recentResponseTimes = this.metrics.responseTimes.filter((time) => time > 0)

    const requestsPerMinute = recentRequests.length
    const errorRate = recentRequests.length > 0 ? recentErrors.length / recentRequests.length : 0
    const avgResponseTime =
      recentResponseTimes.length > 0
        ? recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length
        : 0

    // Determine overall status
    const serviceStatuses = Object.values(services).map((s) => s.status)
    const hasUnhealthy = serviceStatuses.includes("unhealthy")
    const hasDegraded = serviceStatuses.includes("degraded")

    let status: "healthy" | "degraded" | "unhealthy" = "healthy"
    if (hasUnhealthy || errorRate > this.config.alerting.rules.errorRate.threshold) {
      status = "unhealthy"
    } else if (hasDegraded || avgResponseTime > this.config.alerting.rules.responseTime.threshold) {
      status = "degraded"
    }

    return {
      status,
      timestamp: new Date(),
      uptime: process.uptime?.() || 0,
      memory: {
        used: memUsage.heapUsed,
        total: totalMemory,
        percentage: memUsage.heapUsed / totalMemory,
      },
      cpu: {
        usage: 0, // Simplified - would need more complex calculation
      },
      services,
      metrics: {
        requestsPerMinute,
        errorRate,
        avgResponseTime,
      },
    }
  }

  recordRequest(responseTime: number, isError: boolean): void {
    const now = Date.now()
    this.metrics.requests.push(now)
    this.metrics.responseTimes.push(responseTime)

    if (isError) {
      this.metrics.errors.push(now)
    }

    // Clean old metrics (keep only last hour)
    const oneHourAgo = now - 3600000
    this.metrics.requests = this.metrics.requests.filter((timestamp) => timestamp > oneHourAgo)
    this.metrics.errors = this.metrics.errors.filter((timestamp) => timestamp > oneHourAgo)
    this.metrics.responseTimes = this.metrics.responseTimes.filter((timestamp) => timestamp > oneHourAgo)
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private async performHealthChecks(): Promise<void> {
    if (!this.config.monitoring.enabled) return

    try {
      const health = await this.getSystemHealth()

      // Check alerting rules
      await this.checkAlertingRules(health)

      this.logger.debug(`System health: ${health.status}`, {
        uptime: health.uptime,
        memoryUsage: health.memory.percentage,
        errorRate: health.metrics.errorRate,
        avgResponseTime: health.metrics.avgResponseTime,
      })
    } catch (error) {
      this.logger.error("Error during health check:", error)
    }
  }

  private async checkAlertingRules(health: SystemHealth): Promise<void> {
    const alerts: string[] = []

    // Check error rate
    if (health.metrics.errorRate > this.config.alerting.rules.errorRate.threshold) {
      alerts.push(`High error rate: ${(health.metrics.errorRate * 100).toFixed(2)}%`)
    }

    // Check response time
    if (health.metrics.avgResponseTime > this.config.alerting.rules.responseTime.threshold) {
      alerts.push(`High response time: ${health.metrics.avgResponseTime.toFixed(2)}ms`)
    }

    // Check memory usage
    if (health.memory.percentage > this.config.alerting.rules.memoryUsage.threshold) {
      alerts.push(`High memory usage: ${(health.memory.percentage * 100).toFixed(2)}%`)
    }

    // Check service health
    for (const [serviceName, serviceHealth] of Object.entries(health.services)) {
      if (serviceHealth.status === "unhealthy") {
        alerts.push(`Service ${serviceName} is unhealthy: ${serviceHealth.error || "Unknown error"}`)
      }
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.alertingService.sendAlert("System Health Alert", alerts.join("\n"), "high")
    }
  }
}
