/**
 * Base event metadata that all events must include
 */
export interface EventMetadata {
  timestamp: Date;
  traceId: string;
  eventType: string;
  version: string;
  source: string;
  correlationId?: string;
}

/**
 * Base event structure
 */
export interface BaseEvent<T = any> {
  metadata: EventMetadata;
  payload: T;
}

/**
 * Event publishing options
 */
export interface PublishOptions {
  priority?: number;
  expiration?: number;
  persistent?: boolean;
  headers?: Record<string, any>;
}

/**
 * Event handler configuration
 */
export interface EventHandlerConfig {
  eventType: string;
  queue: string;
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Dead Letter Queue message
 */
export interface DLQMessage {
  originalEvent: BaseEvent;
  error: {
    message: string;
    stack?: string;
    timestamp: Date;
  };
  attempts: number;
  lastAttempt: Date;
}
