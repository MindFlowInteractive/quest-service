import { registerAs } from "@nestjs/config"

export interface LoggingConfig {
  level: string
  format: "json" | "simple"
  transports: {
    console: {
      enabled: boolean
      level: string
      colorize: boolean
    }
    file: {
      enabled: boolean
      level: string
      filename: string
      maxSize: string
      maxFiles: number
      datePattern: string
    }
    elasticsearch: {
      enabled: boolean
      level: string
      index: string
      host: string
    }
    http: {
      enabled: boolean
      level: string
      host: string
      path: string
    }
  }
  correlation: {
    enabled: boolean
    headerName: string
    generateId: boolean
  }
  performance: {
    enabled: boolean
    slowRequestThreshold: number
    trackMemoryUsage: boolean
  }
  monitoring: {
    enabled: boolean
    metricsInterval: number
    healthCheckInterval: number
    retentionDays: number
  }
  alerting: {
    enabled: boolean
    channels: {
      email: {
        enabled: boolean
        smtp: {
          host: string
          port: number
          secure: boolean
          auth: {
            user: string
            pass: string
          }
        }
        from: string
        to: string[]
      }
      slack: {
        enabled: boolean
        webhookUrl: string
        channel: string
      }
      webhook: {
        enabled: boolean
        url: string
        headers: Record<string, string>
      }
    }
    rules: {
      errorRate: {
        threshold: number
        window: number
      }
      responseTime: {
        threshold: number
        window: number
      }
      memoryUsage: {
        threshold: number
        window: number
      }
    }
  }
}

export const loggingConfig = registerAs(
  "logging",
  (): LoggingConfig => ({
    level: process.env.LOG_LEVEL || "info",
    format: (process.env.LOG_FORMAT as "json" | "simple") || "json",
    transports: {
      console: {
        enabled: process.env.LOG_CONSOLE_ENABLED !== "false",
        level: process.env.LOG_CONSOLE_LEVEL || "info",
        colorize: process.env.NODE_ENV !== "production",
      },
      file: {
        enabled: process.env.LOG_FILE_ENABLED === "true",
        level: process.env.LOG_FILE_LEVEL || "info",
        filename: process.env.LOG_FILE_NAME || "logs/app-%DATE%.log",
        maxSize: process.env.LOG_FILE_MAX_SIZE || "20m",
        maxFiles: Number.parseInt(process.env.LOG_FILE_MAX_FILES || "14"),
        datePattern: process.env.LOG_FILE_DATE_PATTERN || "YYYY-MM-DD",
      },
      elasticsearch: {
        enabled: process.env.LOG_ELASTICSEARCH_ENABLED === "true",
        level: process.env.LOG_ELASTICSEARCH_LEVEL || "info",
        index: process.env.LOG_ELASTICSEARCH_INDEX || "nestjs-logs",
        host: process.env.LOG_ELASTICSEARCH_HOST || "http://localhost:9200",
      },
      http: {
        enabled: process.env.LOG_HTTP_ENABLED === "true",
        level: process.env.LOG_HTTP_LEVEL || "error",
        host: process.env.LOG_HTTP_HOST || "http://localhost:3001",
        path: process.env.LOG_HTTP_PATH || "/logs",
      },
    },
    correlation: {
      enabled: process.env.LOG_CORRELATION_ENABLED !== "false",
      headerName: process.env.LOG_CORRELATION_HEADER || "x-correlation-id",
      generateId: process.env.LOG_CORRELATION_GENERATE !== "false",
    },
    performance: {
      enabled: process.env.LOG_PERFORMANCE_ENABLED !== "false",
      slowRequestThreshold: Number.parseInt(process.env.LOG_SLOW_REQUEST_THRESHOLD || "1000"),
      trackMemoryUsage: process.env.LOG_TRACK_MEMORY === "true",
    },
    monitoring: {
      enabled: process.env.MONITORING_ENABLED !== "false",
      metricsInterval: Number.parseInt(process.env.MONITORING_METRICS_INTERVAL || "60000"),
      healthCheckInterval: Number.parseInt(process.env.MONITORING_HEALTH_INTERVAL || "30000"),
      retentionDays: Number.parseInt(process.env.MONITORING_RETENTION_DAYS || "30"),
    },
    alerting: {
      enabled: process.env.ALERTING_ENABLED === "true",
      channels: {
        email: {
          enabled: process.env.ALERTING_EMAIL_ENABLED === "true",
          smtp: {
            host: process.env.SMTP_HOST || "localhost",
            port: Number.parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER || "",
              pass: process.env.SMTP_PASS || "",
            },
          },
          from: process.env.ALERTING_EMAIL_FROM || "alerts@example.com",
          to: (process.env.ALERTING_EMAIL_TO || "").split(",").filter(Boolean),
        },
        slack: {
          enabled: process.env.ALERTING_SLACK_ENABLED === "true",
          webhookUrl: process.env.ALERTING_SLACK_WEBHOOK || "",
          channel: process.env.ALERTING_SLACK_CHANNEL || "#alerts",
        },
        webhook: {
          enabled: process.env.ALERTING_WEBHOOK_ENABLED === "true",
          url: process.env.ALERTING_WEBHOOK_URL || "",
          headers: JSON.parse(process.env.ALERTING_WEBHOOK_HEADERS || "{}"),
        },
      },
      rules: {
        errorRate: {
          threshold: Number.parseFloat(process.env.ALERTING_ERROR_RATE_THRESHOLD || "0.05"),
          window: Number.parseInt(process.env.ALERTING_ERROR_RATE_WINDOW || "300000"),
        },
        responseTime: {
          threshold: Number.parseInt(process.env.ALERTING_RESPONSE_TIME_THRESHOLD || "2000"),
          window: Number.parseInt(process.env.ALERTING_RESPONSE_TIME_WINDOW || "300000"),
        },
        memoryUsage: {
          threshold: Number.parseFloat(process.env.ALERTING_MEMORY_THRESHOLD || "0.85"),
          window: Number.parseInt(process.env.ALERTING_MEMORY_WINDOW || "300000"),
        },
      },
    },
  }),
)
