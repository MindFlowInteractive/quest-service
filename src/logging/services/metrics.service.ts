import { Injectable } from "@nestjs/common"
import type { ConfigType } from "@nestjs/config"
import { Counter, Histogram, Gauge, register } from "prom-client"
import type { loggingConfig } from "../config/logging.config"

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal: Counter<string>
  private readonly httpRequestDuration: Histogram<string>
  private readonly httpRequestsInFlight: Gauge<string>
  private readonly errorCounter: Counter<string>
  private readonly businessEventCounter: Counter<string>
  private readonly memoryUsage: Gauge<string>
  private readonly cpuUsage: Gauge<string>
  private readonly config: ConfigType<typeof loggingConfig>

  constructor(config: ConfigType<typeof loggingConfig>) {
    this.config = config

    // HTTP Metrics
    this.httpRequestsTotal = new Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "route", "status_code"],
    })

    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    })

    this.httpRequestsInFlight = new Gauge({
      name: "http_requests_in_flight",
      help: "Number of HTTP requests currently being processed",
    })

    // Error Metrics
    this.errorCounter = new Counter({
      name: "errors_total",
      help: "Total number of errors",
      labelNames: ["type", "severity"],
    })

    // Business Metrics
    this.businessEventCounter = new Counter({
      name: "business_events_total",
      help: "Total number of business events",
      labelNames: ["event_type", "event_name"],
    })

    // System Metrics
    this.memoryUsage = new Gauge({
      name: "memory_usage_bytes",
      help: "Memory usage in bytes",
      labelNames: ["type"],
    })

    this.cpuUsage = new Gauge({
      name: "cpu_usage_percent",
      help: "CPU usage percentage",
    })

    this.startSystemMetricsCollection()
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    const labels = { method, route, status_code: statusCode.toString() }

    this.httpRequestsTotal.inc(labels)
    this.httpRequestDuration.observe(labels, duration / 1000) // Convert to seconds
  }

  recordHttpRequestStart(): () => void {
    this.httpRequestsInFlight.inc()
    return () => this.httpRequestsInFlight.dec()
  }

  recordError(type: string, severity: "low" | "medium" | "high" | "critical"): void {
    this.errorCounter.inc({ type, severity })
  }

  recordBusinessEvent(eventType: string, eventName: string): void {
    this.businessEventCounter.inc({ event_type: eventType, event_name: eventName })
  }

  async getMetrics(): Promise<string> {
    return register.metrics()
  }

  getMetricsJSON(): Promise<any[]> {
    return register.getMetricsAsJSON()
  }

  private startSystemMetricsCollection(): void {
    if (!this.config.monitoring.enabled) return

    setInterval(() => {
      this.collectSystemMetrics()
    }, this.config.monitoring.metricsInterval)
  }

  private collectSystemMetrics(): void {
    // Memory metrics
    const memUsage = process.memoryUsage()
    this.memoryUsage.set({ type: "rss" }, memUsage.rss)
    this.memoryUsage.set({ type: "heap_used" }, memUsage.heapUsed)
    this.memoryUsage.set({ type: "heap_total" }, memUsage.heapTotal)
    this.memoryUsage.set({ type: "external" }, memUsage.external)

    // CPU metrics (simplified)
    const cpuUsage = process.cpuUsage()
    const totalUsage = cpuUsage.user + cpuUsage.system
    this.cpuUsage.set(totalUsage / 1000000) // Convert to seconds
  }
}
