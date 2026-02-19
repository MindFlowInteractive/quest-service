import { Injectable } from "@nestjs/common"

export interface PerformanceMetric {
  operationName: string
  duration: number
  timestamp: Date
  metadata?: Record<string, any>
}

@Injectable()
export class PerformanceService {
  private readonly metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 10000

  startTimer(operationName: string): (labels?: Record<string, any>) => void {
    const start = Date.now()
    return (labels?: Record<string, any>) => {
      const duration = Date.now() - start
      this.recordMetric({
        operationName,
        duration,
        timestamp: new Date(),
        metadata: labels,
      })
    }
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  getMetrics(operationName?: string, limit = 100): PerformanceMetric[] {
    let result = this.metrics
    if (operationName) {
      result = result.filter((m) => m.operationName === operationName)
    }
    return result.slice(-limit)
  }

  getPerformanceStats(operationName: string): {
    count: number
    avgDuration: number
    minDuration: number
    maxDuration: number
  } {
    const filtered = this.metrics.filter((m) => m.operationName === operationName)
    if (filtered.length === 0) {
      return { count: 0, avgDuration: 0, minDuration: 0, maxDuration: 0 }
    }

    const durations = filtered.map((m) => m.duration)
    return {
      count: durations.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    }
  }
}
