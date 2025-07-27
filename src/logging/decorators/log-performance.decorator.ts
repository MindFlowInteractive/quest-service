import { SetMetadata } from "@nestjs/common"

export const LOG_PERFORMANCE_KEY = "log_performance"

export interface LogPerformanceOptions {
  name?: string
  threshold?: number
  includeArgs?: boolean
  includeResult?: boolean
}

export function LogPerformance(options: LogPerformanceOptions = {}) {
  return SetMetadata(LOG_PERFORMANCE_KEY, options)
}
