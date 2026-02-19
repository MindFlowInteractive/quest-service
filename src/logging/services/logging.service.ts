import { Injectable, type LoggerService } from "@nestjs/common"
import type { ConfigType } from "@nestjs/config"
import * as winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"
import { ElasticsearchTransport } from "winston-elasticsearch"
import type { loggingConfig } from "../config/logging.config"
import type { CorrelationService } from "./correlation.service"

export interface LogContext {
  correlationId?: string
  userId?: string
  requestId?: string
  method?: string
  url?: string
  userAgent?: string
  ip?: string
  duration?: number
  statusCode?: number
  error?: Error | { name?: string; message?: string; stack?: string }
  metadata?: Record<string, any>
  trace?: string
  className?: string
  methodName?: string
  timestamp?: string
  context?: string
  pid?: number
  hostname?: string
  args?: any
  resultType?: string
}

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger: winston.Logger
  private readonly context = "Application"
  private readonly config: ConfigType<typeof loggingConfig>
  private readonly correlationService: CorrelationService

  constructor(config: ConfigType<typeof loggingConfig>, correlationService: CorrelationService) {
    this.config = config
    this.correlationService = correlationService
    this.logger = this.createLogger()
  }

  log(message: string, context?: LogContext): void {
    this.logger.info(message, this.enrichContext(context))
  }

  error(message: string, trace?: string, context?: LogContext): void {
    this.logger.error(message, this.enrichContext({ ...context, trace }))
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, this.enrichContext(context))
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.enrichContext(context))
  }

  verbose(message: string, context?: LogContext): void {
    this.logger.verbose(message, this.enrichContext(context))
  }

  logRequest(req: any, res: any, duration: number): void {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
      duration,
      statusCode: res.statusCode,
      userId: req.user?.id,
    }

    const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`

    if (res.statusCode >= 400) {
      this.error(message, undefined, context)
    } else if (duration > this.config.performance.slowRequestThreshold) {
      this.warn(`Slow request: ${message}`, context)
    } else {
      this.log(message, context)
    }
  }

  logError(error: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any,
    }

    this.error(`Unhandled error: ${error.message}`, error.stack, errorContext)
  }

  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const context: LogContext = {
      duration,
      metadata: {
        operation,
        ...metadata,
      },
    }

    if (duration > this.config.performance.slowRequestThreshold) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, context)
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`, context)
    }
  }

  logBusinessEvent(event: string, data?: Record<string, any>): void {
    this.log(`Business Event: ${event}`, {
      metadata: {
        eventType: "business",
        event,
        ...data,
      },
    })
  }

  logSecurityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      metadata: {
        ...context?.metadata,
        eventType: "security",
        event,
      },
    })
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = []

    // Console transport
    if (this.config.transports.console.enabled) {
      transports.push(
        new winston.transports.Console({
          level: this.config.transports.console.level,
          format: this.createFormat(this.config.transports.console.colorize),
        }),
      )
    }

    // File transport with rotation
    if (this.config.transports.file.enabled) {
      transports.push(
        new DailyRotateFile({
          level: this.config.transports.file.level,
          filename: this.config.transports.file.filename,
          datePattern: this.config.transports.file.datePattern,
          maxSize: this.config.transports.file.maxSize,
          maxFiles: this.config.transports.file.maxFiles,
          format: this.createFormat(false),
          auditFile: "logs/audit.json",
          createSymlink: true,
          symlinkName: "current.log",
        }),
      )
    }

    // Elasticsearch transport
    if (this.config.transports.elasticsearch.enabled) {
      transports.push(
        new ElasticsearchTransport({
          level: this.config.transports.elasticsearch.level,
          clientOpts: {
            node: this.config.transports.elasticsearch.host,
          },
          index: this.config.transports.elasticsearch.index,
          transformer: (logData) => ({
            "@timestamp": new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            ...logData.meta,
          }),
        }),
      )
    }

    // HTTP transport
    if (this.config.transports.http.enabled) {
      transports.push(
        new winston.transports.Http({
          level: this.config.transports.http.level,
          host: this.config.transports.http.host,
          path: this.config.transports.http.path,
          format: winston.format.json(),
        }),
      )
    }

    return winston.createLogger({
      level: this.config.level,
      format: winston.format.errors({ stack: true }),
      transports,
      exitOnError: false,
      handleExceptions: true,
      handleRejections: true,
    })
  }

  private createFormat(colorize: boolean): winston.Logform.Format {
    const formats = [winston.format.timestamp(), winston.format.errors({ stack: true })]

    if (this.config.format === "json") {
      formats.push(winston.format.json())
    } else {
      formats.push(
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
          return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`
        }),
      )
    }

    if (colorize) {
      formats.unshift(winston.format.colorize())
    }

    return winston.format.combine(...formats)
  }

  private enrichContext(context?: LogContext): LogContext {
    const correlationId = this.correlationService.getId()

    return {
      ...context,
      correlationId,
      timestamp: new Date().toISOString(),
      context: this.context,
      pid: process.pid,
      hostname: require("os").hostname(),
    }
  }
}
