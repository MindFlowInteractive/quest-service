import { Injectable, NestMiddleware } from "@nestjs/common"
import type { LoggingService } from "../services/logging.service"
import type { MonitoringService } from "../services/monitoring.service"
import type { MetricsService } from "../services/metrics.service"

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly monitoringService: MonitoringService,
    private readonly metricsService: MetricsService,
  ) {}

  use(req: any, res: any, next: () => void): void {
    const startTime = Date.now()
    const endRequest = this.metricsService.recordHttpRequestStart()

    // Log request start
    this.loggingService.debug(`Incoming request: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    })

    // Override res.end to capture response
    const originalEnd = res.end
    const self = this
    res.end = function (chunk?: any, encoding?: any, cb?: any) {
      const duration = Date.now() - startTime
      const isError = res.statusCode >= 400

      // Record metrics
      endRequest()
      self.metricsService.recordHttpRequest(req.method, req.route?.path || req.url, res.statusCode, duration)
      self.monitoringService.recordRequest(duration, isError)

      // Log request completion
      self.loggingService.logRequest(req, res, duration)

      // Call original end
      return originalEnd.call(this, chunk, encoding, cb)
    }

    next()
  }
}
