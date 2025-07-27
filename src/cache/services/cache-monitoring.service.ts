import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import type { CacheMetrics } from "./cache.service"

@Injectable()
export class CacheMonitoringService {
  private readonly logger = new Logger(CacheMonitoringService.name)
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    avgResponseTime: 0,
  }
  private responseTimes: number[] = []

  recordHit(layer: "l1" | "l2", responseTime: number): void {
    this.metrics.hits++
    this.recordResponseTime(responseTime)
  }

  recordMiss(responseTime: number): void {
    this.metrics.misses++
    this.recordResponseTime(responseTime)
  }

  recordSet(responseTime: number): void {
    this.metrics.sets++
    this.recordResponseTime(responseTime)
  }

  recordDelete(responseTime: number): void {
    this.metrics.deletes++
    this.recordResponseTime(responseTime)
  }

  recordError(): void {
    this.metrics.errors++
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  getHitRatio(): number {
    const total = this.metrics.hits + this.metrics.misses
    return total > 0 ? this.metrics.hits / total : 0
  }

  getErrorRate(): number {
    const total = this.metrics.hits + this.metrics.misses + this.metrics.errors
    return total > 0 ? this.metrics.errors / total : 0
  }

  @Cron(CronExpression.EVERY_MINUTE)
  private logMetrics(): void {
    const hitRatio = this.getHitRatio()
    const errorRate = this.getErrorRate()

    this.logger.log(
      `Cache Metrics - Hit Ratio: ${(hitRatio * 100).toFixed(2)}%, ` +
        `Avg Response Time: ${this.metrics.avgResponseTime.toFixed(2)}ms, ` +
        `Error Rate: ${(errorRate * 100).toFixed(2)}%`,
    )

    // Check thresholds and alert if necessary
    this.checkAlertThresholds(hitRatio, errorRate)
  }

  @Cron(CronExpression.EVERY_HOUR)
  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      avgResponseTime: 0,
    }
    this.responseTimes = []
  }

  private recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime)

    // Keep only last 1000 response times for average calculation
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000)
    }

    this.metrics.avgResponseTime = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
  }

  private checkAlertThresholds(hitRatio: number, errorRate: number): void {
    if (hitRatio < 0.8) {
      this.logger.warn(`Cache hit ratio is low: ${(hitRatio * 100).toFixed(2)}%`)
    }

    if (this.metrics.avgResponseTime > 100) {
      this.logger.warn(`Cache response time is high: ${this.metrics.avgResponseTime.toFixed(2)}ms`)
    }

    if (errorRate > 0.05) {
      this.logger.error(`Cache error rate is high: ${(errorRate * 100).toFixed(2)}%`)
    }
  }
}
