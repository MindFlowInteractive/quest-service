/**
 * RabbitMQ connection configuration
 */
export interface RabbitMQConfig {
  url: string;
  username: string;
  password: string;
  vhost?: string;
  heartbeat?: number;
  connectionTimeout?: number;
  prefetchCount?: number;
}

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Event bus configuration
 */
export interface EventBusConfig {
  rabbitmq: RabbitMQConfig;
  retry: RetryConfig;
  dlqPrefix?: string;
  exchangeName?: string;
  serviceName: string;
}

/**
 * Default retry configuration with exponential backoff
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  backoffMultiplier: 2,
};

/**
 * Calculate delay for retry attempt using exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}
