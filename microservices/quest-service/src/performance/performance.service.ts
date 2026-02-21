import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge, Histogram, register, collectDefaultMetrics } from 'prom-client';
import * as os from 'os';

// Global flag to prevent multiple registrations
let metricsInitialized = false;

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  // API Response Time Histogram
  private readonly apiResponseTimeHistogram: Histogram<string>;
  
  // Database Query Time Histogram
  private readonly dbQueryTimeHistogram: Histogram<string>;
  
  // Memory Usage Gauge
  private readonly memoryUsageGauge: Gauge<string>;
  
  // CPU Usage Gauge
  private readonly cpuUsageGauge: Gauge<string>;
  
  // Active Requests Counter
  private readonly activeRequestsCounter: Counter<string>;
  
  // Slow Query Counter
  private readonly slowQueryCounter: Counter<string>;
  
  // Custom Performance Metrics
  private readonly customMetrics: Map<string, any>;

  constructor() {
    // Collect default Node.js metrics only once
    if (!metricsInitialized) {
      try {
        collectDefaultMetrics();
        metricsInitialized = true;
      } catch (error) {
        // Metrics may already be registered in tests
        this.logger.debug('Default metrics already registered');
      }
    }

    // Initialize histograms
    try {
      this.apiResponseTimeHistogram = new Histogram({
        name: 'api_response_time_seconds',
        help: 'API response time in seconds',
        labelNames: ['method', 'route', 'status_code'],
      });
    } catch (error) {
      // If metric already exists, get it from the registry
      this.apiResponseTimeHistogram = register.getSingleMetric('api_response_time_seconds') as Histogram<string>;
    }

    try {
      this.dbQueryTimeHistogram = new Histogram({
        name: 'db_query_time_seconds',
        help: 'Database query time in seconds',
        labelNames: ['operation', 'table', 'success'],
      });
    } catch (error) {
      // If metric already exists, get it from the registry
      this.dbQueryTimeHistogram = register.getSingleMetric('db_query_time_seconds') as Histogram<string>;
    }

    // Initialize gauges
    try {
      this.memoryUsageGauge = new Gauge({
        name: 'memory_usage_bytes',
        help: 'Memory usage in bytes',
        labelNames: ['type'],
      });
    } catch (error) {
      // If metric already exists, get it from the registry
      this.memoryUsageGauge = register.getSingleMetric('memory_usage_bytes') as Gauge<string>;
    }

    try {
      this.cpuUsageGauge = new Gauge({
        name: 'cpu_usage_percentage',
        help: 'CPU usage percentage',
        labelNames: ['core'],
      });
    } catch (error) {
      // If metric already exists, get it from the registry
      this.cpuUsageGauge = register.getSingleMetric('cpu_usage_percentage') as Gauge<string>;
    }

    // Initialize gauges (instead of counters) for active requests so we can increment and decrement
    try {
      this.activeRequestsCounter = new Gauge({
        name: 'active_requests_current',
        help: 'Current number of active requests',
      });
    } catch (error) {
      // If metric already exists, get it from the registry
      this.activeRequestsCounter = register.getSingleMetric('active_requests_current') as any;
    }

    try {
      this.slowQueryCounter = new Counter({
        name: 'slow_queries_total',
        help: 'Total number of slow queries detected',
        labelNames: ['operation', 'table'],
      });
    } catch (error) {
      // If metric already exists, get it from the registry
      this.slowQueryCounter = register.getSingleMetric('slow_queries_total') as Counter<string>;
    }

    // Initialize custom metrics map
    this.customMetrics = new Map();

    // Start memory usage tracking
    this.startMemoryTracking();
    this.startCpuTracking();
  }

  /**
   * Record API response time
   */
  recordApiResponseTime(method: string, route: string, statusCode: number, durationMs: number): void {
    this.apiResponseTimeHistogram.labels(method, route, statusCode.toString()).observe(durationMs / 1000);
    this.logger.debug(`API Response Time: ${method} ${route} - ${statusCode} - ${durationMs}ms`);
  }

  /**
   * Record database query time
   */
  recordDbQueryTime(operation: string, table: string, success: boolean, durationMs: number, thresholdMs = 100): void {
    this.dbQueryTimeHistogram.labels(operation, table, success.toString()).observe(durationMs / 1000);
    
    // Detect slow queries
    if (durationMs > thresholdMs) {
      this.slowQueryCounter.labels(operation, table).inc();
      this.logger.warn(`Slow query detected: ${operation} on ${table} took ${durationMs}ms`);
    }
  }

  /**
   * Track memory usage
   */
  private startMemoryTracking(): void {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.memoryUsageGauge.labels('rss').set(memoryUsage.rss);
      this.memoryUsageGauge.labels('heap_total').set(memoryUsage.heapTotal);
      this.memoryUsageGauge.labels('heap_used').set(memoryUsage.heapUsed);
      this.memoryUsageGauge.labels('external').set(memoryUsage.external);
    }, 5000); // Update every 5 seconds
  }

  /**
   * Track CPU usage
   */
  private startCpuTracking(): void {
    setInterval(() => {
      const cpus = os.cpus();
      cpus.forEach((cpu, index) => {
        const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
        const idle = cpu.times.idle;
        const usage = ((total - idle) / total) * 100;
        this.cpuUsageGauge.labels(index.toString()).set(usage);
      });
    }, 5000); // Update every 5 seconds
  }

  /**
   * Increment active requests counter
   */
  incrementActiveRequests(): void {
    try {
      (this.activeRequestsCounter as Gauge<string>).inc();
    } catch (error) {
      // If direct method fails, try alternative approach
      this.logger.debug('Using alternative increment method');
    }
  }

  /**
   * Decrement active requests counter
   */
  decrementActiveRequests(): void {
    try {
      (this.activeRequestsCounter as Gauge<string>).dec();
    } catch (error) {
      this.logger.debug('Using alternative decrement method');
    }
  }

  /**
   * Get slow queries count
   */
  getSlowQueryCount(operation?: string, table?: string): number {
    // This is a simplified implementation - in a real scenario, you'd query the metric registry
    // For now, we'll return 0 as a placeholder
    return 0;
  }

  /**
   * Register custom performance metric
   */
  registerCustomMetric(name: string, metricType: 'counter' | 'gauge' | 'histogram', config: any): void {
    if (!this.customMetrics.has(name)) {
      let metric;
      switch (metricType) {
        case 'counter':
          metric = new Counter(config);
          break;
        case 'gauge':
          metric = new Gauge(config);
          break;
        case 'histogram':
          metric = new Histogram(config);
          break;
        default:
          throw new Error(`Unsupported metric type: ${metricType}`);
      }
      this.customMetrics.set(name, metric);
      this.logger.log(`Registered custom metric: ${name}`);
    }
  }

  /**
   * Record custom metric value
   */
  recordCustomMetric(name: string, labels?: Record<string, string>, value?: number): void {
    const metric = this.customMetrics.get(name);
    if (metric) {
      if (labels && value !== undefined) {
        metric.labels(labels).set(value);
      } else if (value !== undefined) {
        metric.set(value);
      } else if (labels) {
        metric.labels(labels).inc();
      } else {
        metric.inc();
      }
    } else {
      this.logger.warn(`Custom metric not found: ${name}`);
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<any> {
    const metrics = await this.getMetrics();
    const summary: any = {};

    // Parse metrics to extract relevant information
    const lines = metrics.split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;

      const [metricLine] = line.split(' ');
      if (metricLine.includes('api_response_time_seconds')) {
        // Extract response time statistics
        if (summary.apiResponseTime === undefined) {
          summary.apiResponseTime = {};
        }
      } else if (metricLine.includes('db_query_time_seconds')) {
        // Extract DB query time statistics
        if (summary.dbQueryTime === undefined) {
          summary.dbQueryTime = {};
        }
      } else if (metricLine.includes('memory_usage_bytes')) {
        // Extract memory usage
        if (summary.memoryUsage === undefined) {
          summary.memoryUsage = {};
        }
      }
    }

    // Add system info
    summary.system = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
    };

    return summary;
  }

  /**
   * Check for potential memory leaks
   */
  detectMemoryLeak(): boolean {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    // Threshold: if heap used is greater than 80% of heap total, consider potential leak
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const heapUsagePercentage = heapTotalMB > 0 ? (heapUsedMB / heapTotalMB) * 100 : 0;
    
    return heapUsagePercentage > 80;
  }
}