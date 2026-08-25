import { Logger } from '@nestjs/common';
import { ExternalServiceTimeoutException } from '../exceptions/infrastructure.exceptions';
import { TimeoutException } from '../exceptions/domain.exceptions';

/**
 * Retry strategy configuration
 */
export interface RetryStrategyConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Jitter factor for randomizing delays (0-1) */
  jitterFactor: number;
  /** Timeout for each attempt in milliseconds */
  timeoutPerAttempt?: number;
  /** Predicate to determine if error is retryable */
  retryPredicate?: (error: Error) => boolean;
  /** Whether to log retry attempts */
  logRetries: boolean;
}

/**
 * Default retry strategy configuration
 */
const DEFAULT_RETRY_CONFIG: RetryStrategyConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  exponentialBackoff: true,
  backoffMultiplier: 2,
  jitterFactor: 0.1, // 10% jitter
  timeoutPerAttempt: 30000, // 30 seconds
  logRetries: true,
};

/**
 * Retry attempt statistics
 */
export interface RetryStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  totalRetryDelay: number;
  averageAttemptDuration: number;
}

/**
 * Retry operation result
 */
export interface RetryResult<T> {
  /** Operation result if successful */
  result: T;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent including retries */
  totalTime: number;
  /** Whether operation succeeded */
  success: true;
}

export interface RetryError {
  /** Last error encountered */
  error: Error;
  /** Number of attempts made */
  attempts: number;
  /** Total time spent including retries */
  totalTime: number;
  /** Whether operation succeeded */
  success: false;
}

/**
 * Flexible retry strategy implementation with exponential backoff and jitter
 */
export class RetryStrategy {
  private readonly logger = new Logger(RetryStrategy.name);
  private readonly config: RetryStrategyConfig;

  private stats: RetryStats = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    totalRetryDelay: 0,
    averageAttemptDuration: 0,
  };

  constructor(config?: Partial<RetryStrategyConfig>) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName?: string,
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error;
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      attempt++;
      this.stats.totalAttempts++;

      const attemptStartTime = Date.now();
      const operationLabel = operationName || `operation attempt ${attempt}`;

      try {
        // Execute the operation with timeout if configured
        const result = this.config.timeoutPerAttempt
          ? await this.executeWithTimeout(operation, operationLabel)
          : await operation();

        const attemptDuration = Date.now() - attemptStartTime;
        this.recordSuccessfulAttempt(attemptDuration);

        return {
          result,
          attempts: attempt,
          totalTime: Date.now() - startTime,
          success: true,
        };
      } catch (error) {
        lastError = error as Error;
        const attemptDuration = Date.now() - attemptStartTime;
        this.recordFailedAttempt(attemptDuration);

        // Check if we should retry
        if (!this.shouldRetry(error as Error, attempt)) {
          break;
        }

        // Calculate delay before next retry
        const delay = this.calculateDelay(attempt);
        this.stats.totalRetryDelay += delay;

        if (this.config.logRetries) {
          this.logRetryAttempt(error as Error, attempt, delay, operationLabel);
        }

        // Wait before next retry
        await this.sleep(delay);
      }
    }

    // All attempts failed
    const totalTime = Date.now() - startTime;

    if (this.config.logRetries) {
      this.logRetryFailure(lastError, attempt, totalTime, operationName);
    }

    return {
      error: lastError,
      attempts: attempt,
      totalTime,
      success: false,
    };
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    operationLabel: string,
  ): Promise<T> {
    const timeout = this.config.timeoutPerAttempt;

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new TimeoutException(operationLabel, timeout));
      }, timeout);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number): number {
    if (attempt === 1) {
      return this.config.baseDelay;
    }

    let delay = this.config.baseDelay;

    if (this.config.exponentialBackoff) {
      delay *= Math.pow(this.config.backoffMultiplier, attempt - 1);
    }

    // Apply maximum delay constraint
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter to avoid thundering herd problem
    if (this.config.jitterFactor > 0) {
      const jitter = delay * this.config.jitterFactor;
      delay += Math.random() * 2 * jitter - jitter;
      delay = Math.max(this.config.baseDelay, delay); // Ensure minimum delay
    }

    return Math.round(delay);
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetry(error: Error, attempt: number): boolean {
    // Check if max attempts reached
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Use custom retry predicate if provided
    if (this.config.retryPredicate) {
      return this.config.retryPredicate(error);
    }

    // Default retryable errors
    const retryableErrorNames = [
      'TimeoutException',
      'ExternalServiceTimeoutException',
      'ExternalServiceUnavailableException',
      'NetworkError',
      'ConnectionError',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
    ];

    // Check error name or message
    const errorName = error.constructor.name;
    const errorMessage = error.message.toLowerCase();

    return (
      retryableErrorNames.includes(errorName) ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('unavailable') ||
      errorMessage.includes('retry') ||
      errorMessage.includes('busy')
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Record successful attempt statistics
   */
  private recordSuccessfulAttempt(duration: number): void {
    this.stats.successfulAttempts++;

    // Update average duration
    const totalSuccessfulAttempts = this.stats.successfulAttempts;
    this.stats.averageAttemptDuration =
      (this.stats.averageAttemptDuration * (totalSuccessfulAttempts - 1) +
        duration) /
      totalSuccessfulAttempts;
  }

  /**
   * Record failed attempt statistics
   */
  private recordFailedAttempt(duration: number): void {
    this.stats.failedAttempts++;
  }

  /**
   * Log retry attempt
   */
  private logRetryAttempt(
    error: Error,
    attempt: number,
    delay: number,
    operationLabel: string,
  ): void {
    this.logger.warn(
      `Retry attempt ${attempt}/${this.config.maxAttempts} for ${operationLabel}`,
      {
        error: error.message,
        errorType: error.constructor.name,
        nextRetryIn: `${delay}ms`,
        totalDelay: this.stats.totalRetryDelay,
      },
    );
  }

  /**
   * Log retry failure
   */
  private logRetryFailure(
    error: Error,
    attempts: number,
    totalTime: number,
    operationName?: string,
  ): void {
    this.logger.error(
      `All retry attempts failed for ${operationName || 'operation'}`,
      {
        attempts,
        totalTime: `${totalTime}ms`,
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
      },
    );
  }

  /**
   * Get current retry statistics
   */
  getStats(): RetryStats {
    return { ...this.stats };
  }

  /**
   * Reset retry statistics
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      totalRetryDelay: 0,
      averageAttemptDuration: 0,
    };
  }

  /**
   * Update retry configuration
   */
  updateConfig(newConfig: Partial<RetryStrategyConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('Updated retry configuration', this.config);
  }
}

/**
 * Retry strategy registry for managing multiple retry strategies
 */
export class RetryStrategyRegistry {
  private readonly strategies = new Map<string, RetryStrategy>();
  private readonly logger = new Logger(RetryStrategyRegistry.name);

  /**
   * Get or create a retry strategy
   */
  getOrCreate(
    name: string,
    config?: Partial<RetryStrategyConfig>,
  ): RetryStrategy {
    if (!this.strategies.has(name)) {
      this.strategies.set(name, new RetryStrategy(config));
      this.logger.debug(`Created retry strategy ${name}`);
    }

    return this.strategies.get(name);
  }

  /**
   * Get a retry strategy by name
   */
  get(name: string): RetryStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Get all retry strategies
   */
  getAll(): Map<string, RetryStrategy> {
    return new Map(this.strategies);
  }

  /**
   * Get statistics for all retry strategies
   */
  getAllStats(): Record<string, RetryStats> {
    const stats: Record<string, RetryStats> = {};

    for (const [name, strategy] of this.strategies) {
      stats[name] = strategy.getStats();
    }

    return stats;
  }

  /**
   * Reset all retry strategies
   */
  resetAll(): void {
    for (const strategy of this.strategies.values()) {
      strategy.resetStats();
    }
    this.logger.log('Reset all retry strategies');
  }
}

// Global retry strategy registry instance
export const retryStrategyRegistry = new RetryStrategyRegistry();

/**
 * Helper function for simple retry operations
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    operationName?: string;
    config?: Partial<RetryStrategyConfig>;
  },
): Promise<T> {
  const strategy = new RetryStrategy(options?.config);
  const result = await strategy.execute(operation, options?.operationName);

  if (!result.success) {
    throw result.error;
  }

  return result.result;
}

/**
 * Retry decorator for class methods
 */
export function Retryable(options?: Partial<RetryStrategyConfig>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const operationName = `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const strategy = new RetryStrategy(options);
      const operation = () => originalMethod.apply(this, args);

      const result = await strategy.execute(operation, operationName);

      if (!result.success) {
        throw result.error;
      }

      return result.result;
    };

    return descriptor;
  };
}
