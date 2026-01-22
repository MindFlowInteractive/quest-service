import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"
import type { LoggingService } from "../services/logging.service"
import type { MonitoringService } from "../services/monitoring.service"
import type { MetricsService } from "../services/metrics.service"

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly monitoringService: MonitoringService,
    private readonly metricsService: MetricsService,
  ) { }

  use(req: any, res: any, next: any): void {
    const startTime = Date.now()
    const endRequest = this.metricsService.recordHttpRequestStart()

    // Log request start
    this.loggingService.debug(`Incoming request: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      headers: req.headers as any,
    } as any)

    // Override res.end to capture response
    const originalEnd = res.end
    res.end = function (chunk?: any, encoding?: any, cb?: any) {
      const duration = Date.now() - startTime
      const isError = res.statusCode >= 400

      // Record metrics
      endRequest()
      this.metricsService.recordHttpRequest(req.method, req.route?.path || req.url, res.statusCode, duration)
      this.monitoringService.recordRequest(duration, isError)

      // Log request completion
      this.loggingService.logRequest(req, res, duration)

      // Call original end
      originalEnd.call(this, chunk, encoding, cb)
    }.bind(this)

    next()
  }
}
