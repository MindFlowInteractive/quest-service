import { SetMetadata } from "@nestjs/common"

export const LOG_BUSINESS_EVENT_KEY = "log_business_event"

export interface LogBusinessEventOptions {
  event: string
  includeArgs?: boolean
  includeResult?: boolean
  metadata?: Record<string, any>
}

export function LogBusinessEvent(options: LogBusinessEventOptions) {
  return SetMetadata(LOG_BUSINESS_EVENT_KEY, options)
}
