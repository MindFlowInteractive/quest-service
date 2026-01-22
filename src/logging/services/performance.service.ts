import { Injectable, Logger } from "@nestjs/common"

export interface PerformanceMetric {
  name: string
  duration: number
  timestamp: Date
  metadata?: Record<string, any>
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name)
  private readonly metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 10000

  startTimer(name: string): () => PerformanceMetric {
    const startTime = process.hrtime.bigint()
    const startTimestamp = new Date()

    return (metadata?: Record<string, any>): PerformanceMetric => {
      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds

      const metric: PerformanceMetric = {
        name,
        duration,
        timestamp: startTimestamp,
        metadata,
      }

      this.recordMetric(metric)
      return metric
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const timer = this.startTimer(name)
    try {
      const result = await fn()
      timer()
      return result
    } catch (error) {
      timer()
      throw error
    }
  }

  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const timer = this.startTimer(name)
    try {
      const result = fn()
      timer()
      return result
    } catch (error) {
      timer()
      throw error
    }
  }

  getMetrics(name?: string, limit = 100): PerformanceMetric[] {
    let filtered = this.metrics

    if (name) {
      filtered = filtered.filter((metric) => metric.name === name)
    }

    return filtered.slice(-limit)
  }

  getAveragePerformance(name: string, timeWindow = 300000): number {
    const now = Date.now()
    const windowStart = now - timeWindow

    const recentMetrics = this.metrics.filter(
      (metric) => metric.name === name && metric.timestamp.getTime() >= windowStart,
    )

    if (recentMetrics.length === 0) return 0

    const totalDuration = recentMetrics.reduce((sum, metric) => sum + metric.duration, 0)
    return totalDuration / recentMetrics.length
  }

  getPerformanceStats(
    name: string,
    timeWindow = 300000,
  ): {
    count: number
    average: number
    min: number
    max: number
    p95: number
    p99: number
  } {
    const now = Date.now()
    const windowStart = now - timeWindow

    const recentMetrics = this.metrics
      .filter((metric) => metric.name === name && metric.timestamp.getTime() >= windowStart)
      .map((metric) => metric.duration)
      .sort((a, b) => a - b)

    if (recentMetrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0, p99: 0 }
    }

    const count = recentMetrics.length
    const average = recentMetrics.reduce((sum, duration) => sum + duration, 0) / count
    const min = recentMetrics[0]
    const max = recentMetrics[count - 1]
    const p95 = recentMetrics[Math.floor(count * 0.95)]
    const p99 = recentMetrics[Math.floor(count * 0.99)]

    return { count, average, min, max, p95, p99 }
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.splice(0, this.metrics.length - this.maxMetrics)
    }

    // Log slow operations
    if (metric.duration > 1000) {
      this.logger.warn(`Slow operation detected: ${metric.name} took ${metric.duration.toFixed(2)}ms`, {
        metric,
      })
    }
  }
}
