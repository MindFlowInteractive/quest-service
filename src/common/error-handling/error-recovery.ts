import { Logger } from '@nestjs/common';
import { BaseException } from '../exceptions/base.exception';
import { ERROR_CODES, ErrorSeverity } from '../exceptions/error-codes';
import { CircuitBreaker, circuitBreakerRegistry } from './circuit-breaker';
import { RetryStrategy, retryStrategyRegistry } from './retry-strategy';

/**
 * Error recovery strategy types
 */
export enum RecoveryStrategy {
  NONE = 'NONE', // No recovery - fail immediately
  RETRY = 'RETRY', // Retry the operation
  FALLBACK = 'FALLBACK', // Use fallback implementation
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER', // Use circuit breaker
  QUEUE_AND_RETRY = 'QUEUE_AND_RETRY', // Queue for later retry
  DEGRADE = 'DEGRADE', // Degrade functionality gracefully
}

/**
 * Recovery strategy configuration
 */
export interface RecoveryConfig {
  /** Primary recovery strategy */
  primaryStrategy: RecoveryStrategy;
  /** Fallback recovery strategy if primary fails */
  fallbackStrategy?: RecoveryStrategy;
  /** Whether recovery is enabled */
  enabled: boolean;
  /** Maximum recovery attempts */
  maxRecoveryAttempts: number;
  /** Timeout for recovery operations */
  recoveryTimeout: number;
  /** Whether to log recovery attempts */
  logRecovery: boolean;
}

/**
 * Recovery operation result
 */
export interface RecoveryResult<T> {
  /** Recovery strategy used */
  strategy: RecoveryStrategy;
  /** Whether recovery succeeded */
  success: boolean;
  /** Result if successful */
  result?: T;
  /** Error if recovery failed */
  error?: Error;
  /** Number of attempts made */
  attempts: number;
  /** Total recovery time */
  totalTime: number;
}

/**
 * Fallback operation definition
 */
export interface FallbackOperation<T> {
  /** Fallback operation to execute */
  operation: () => Promise<T>;
  /** Description of fallback operation */
  description: string;
  /** Whether fallback is available */
  available: boolean;
}

/**
 * Error recovery manager
 */
export class ErrorRecoveryManager {
  private readonly logger = new Logger(ErrorRecoveryManager.name);
  private readonly recoveryConfigs = new Map<string, RecoveryConfig>();

  /**
   * Register recovery configuration for an operation
   */
  registerRecoveryConfig(
    operationName: string,
    config: Partial<RecoveryConfig>,
  ): void {
    const defaultConfig: RecoveryConfig = {
      primaryStrategy: RecoveryStrategy.RETRY,
      enabled: true,
      maxRecoveryAttempts: 3,
      recoveryTimeout: 30000,
      logRecovery: true,
    };

    this.recoveryConfigs.set(operationName, {
      ...defaultConfig,
      ...config,
    });

    this.logger.debug(
      `Registered recovery config for ${operationName}`,
      config,
    );
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery<T>(
    operation: () => Promise<T>,
    error: Error,
    operationName: string,
    fallback?: FallbackOperation<T>,
  ): Promise<RecoveryResult<T>> {
    const startTime = Date.now();
    const config = this.getRecoveryConfig(operationName);

    if (!config.enabled) {
      return {
        strategy: RecoveryStrategy.NONE,
        success: false,
        error,
        attempts: 0,
        totalTime: Date.now() - startTime,
      };
    }

    // Determine which strategy to use based on error type
    const strategy = this.determineRecoveryStrategy(
      error,
      config,
      operationName,
    );

    if (this.shouldLogRecovery(config, strategy)) {
      this.logRecoveryAttempt(operationName, strategy, error);
    }

    try {
      const result = await this.executeRecoveryStrategy(
        operation,
        error,
        strategy,
        operationName,
        fallback,
        config,
      );

      const totalTime = Date.now() - startTime;

      if (result.success && this.shouldLogRecovery(config, strategy)) {
        this.logRecoverySuccess(operationName, strategy, totalTime);
      }

      return {
        ...result,
        strategy,
        totalTime,
      };
    } catch (recoveryError) {
      const totalTime = Date.now() - startTime;

      if (this.shouldLogRecovery(config, strategy)) {
        this.logRecoveryFailure(
          operationName,
          strategy,
          recoveryError as Error,
          totalTime,
        );
      }

      // Try fallback strategy if configured
      if (config.fallbackStrategy && config.fallbackStrategy !== strategy) {
        return this.attemptFallbackRecovery(
          operation,
          recoveryError as Error,
          operationName,
          fallback,
          config,
          totalTime,
        );
      }

      return {
        strategy,
        success: false,
        error: recoveryError as Error,
        attempts: 1,
        totalTime,
      };
    }
  }

  /**
   * Determine the appropriate recovery strategy
   */
  private determineRecoveryStrategy(
    error: Error,
    config: RecoveryConfig,
    operationName: string,
  ): RecoveryStrategy {
    // Use circuit breaker for external service errors
    if (
      error.constructor.name.includes('ExternalService') ||
      error.message.includes('service unavailable') ||
      error.message.includes('timeout')
    ) {
      return RecoveryStrategy.CIRCUIT_BREAKER;
    }

    // Use retry for temporary failures
    if (
      error.message.includes('retry') ||
      error.message.includes('temporary') ||
      error.message.includes('busy')
    ) {
      return RecoveryStrategy.RETRY;
    }

    // Default to configured primary strategy
    return config.primaryStrategy;
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecoveryStrategy<T>(
    originalOperation: () => Promise<T>,
    originalError: Error,
    strategy: RecoveryStrategy,
    operationName: string,
    fallback: FallbackOperation<T> | undefined,
    config: RecoveryConfig,
  ): Promise<Omit<RecoveryResult<T>, 'strategy' | 'totalTime'>> {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return this.executeRetryStrategy(
          originalOperation,
          operationName,
          config,
        );

      case RecoveryStrategy.FALLBACK:
        return this.executeFallbackStrategy(fallback, operationName);

      case RecoveryStrategy.CIRCUIT_BREAKER:
        return this.executeCircuitBreakerStrategy(
          originalOperation,
          operationName,
        );

      case RecoveryStrategy.QUEUE_AND_RETRY:
        return this.executeQueueAndRetryStrategy(
          originalOperation,
          originalError,
          operationName,
        );

      case RecoveryStrategy.DEGRADE:
        return this.executeDegradeStrategy(originalOperation, operationName);

      case RecoveryStrategy.NONE:
      default:
        throw originalError;
    }
  }

  /**
   * Execute retry strategy
   */
  private async executeRetryStrategy<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RecoveryConfig,
  ): Promise<Omit<RecoveryResult<T>, 'strategy' | 'totalTime'>> {
    const retryStrategy = retryStrategyRegistry.getOrCreate(operationName, {
      maxAttempts: config.maxRecoveryAttempts,
      timeoutPerAttempt: config.recoveryTimeout,
    });

    const result = await retryStrategy.execute(operation, operationName);

    if (result.success) {
      return {
        success: true,
        result: result.result,
        attempts: result.attempts,
      };
    } else {
      throw result.error;
    }
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallbackStrategy<T>(
    fallback: FallbackOperation<T> | undefined,
    operationName: string,
  ): Promise<Omit<RecoveryResult<T>, 'strategy' | 'totalTime'>> {
    if (!fallback || !fallback.available) {
      throw new Error(`No fallback available for ${operationName}`);
    }

    try {
      const result = await fallback.operation();
      return {
        success: true,
        result,
        attempts: 1,
      };
    } catch (error) {
      throw new Error(`Fallback operation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Execute circuit breaker strategy
   */
  private async executeCircuitBreakerStrategy<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<Omit<RecoveryResult<T>, 'strategy' | 'totalTime'>> {
    const circuitBreaker = circuitBreakerRegistry.getOrCreate({
      name: operationName,
      failureThreshold: 3,
      recoveryTimeout: 30000,
    });

    // Use a simple fallback that throws the circuit breaker exception
    const fallback = () => {
      throw new Error(`Circuit breaker is open for ${operationName}`);
    };

    const result = await circuitBreaker.execute(operation, fallback);
    return {
      success: true,
      result,
      attempts: 1,
    };
  }

  /**
   * Execute queue and retry strategy
   */
  private async executeQueueAndRetryStrategy<T>(
    operation: () => Promise<T>,
    error: Error,
    operationName: string,
  ): Promise<Omit<RecoveryResult<T>, 'strategy' | 'totalTime'>> {
    // In a real implementation, this would queue the operation
    // For now, we'll just retry immediately
    this.logger.log(`Queueing operation ${operationName} for later retry`);

    // Simulate queueing by waiting a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const result = await operation();
      return {
        success: true,
        result,
        attempts: 1,
      };
    } catch (retryError) {
      throw retryError;
    }
  }

  /**
   * Execute degrade strategy
   */
  private async executeDegradeStrategy<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<Omit<RecoveryResult<T>, 'strategy' | 'totalTime'>> {
    this.logger.warn(`Degrading functionality for ${operationName}`);

    // In a real implementation, this would return a degraded result
    // For now, we'll throw an error indicating degraded functionality
    throw new Error(`Operation ${operationName} is degraded`);
  }

  /**
   * Attempt fallback recovery
   */
  private async attemptFallbackRecovery<T>(
    operation: () => Promise<T>,
    error: Error,
    operationName: string,
    fallback: FallbackOperation<T> | undefined,
    config: RecoveryConfig,
    previousTime: number,
  ): Promise<RecoveryResult<T>> {
    const startTime = Date.now();

    try {
      const result = await this.executeRecoveryStrategy(
        operation,
        error,
        config.fallbackStrategy,
        operationName,
        fallback,
        config,
      );

      const totalTime = previousTime + (Date.now() - startTime);

      if (
        result.success &&
        this.shouldLogRecovery(config, config.fallbackStrategy)
      ) {
        this.logRecoverySuccess(
          operationName,
          config.fallbackStrategy,
          totalTime,
        );
      }

      return {
        ...result,
        strategy: config.fallbackStrategy,
        totalTime,
      };
    } catch (fallbackError) {
      const totalTime = previousTime + (Date.now() - startTime);

      if (this.shouldLogRecovery(config, config.fallbackStrategy)) {
        this.logRecoveryFailure(
          operationName,
          config.fallbackStrategy,
          fallbackError as Error,
          totalTime,
        );
      }

      return {
        strategy: config.fallbackStrategy,
        success: false,
        error: fallbackError as Error,
        attempts: 1,
        totalTime,
      };
    }
  }

  /**
   * Get recovery configuration for operation
   */
  private getRecoveryConfig(operationName: string): RecoveryConfig {
    if (!this.recoveryConfigs.has(operationName)) {
      // Return default config if not registered
      return {
        primaryStrategy: RecoveryStrategy.RETRY,
        enabled: true,
        maxRecoveryAttempts: 3,
        recoveryTimeout: 30000,
        logRecovery: true,
      };
    }

    return this.recoveryConfigs.get(operationName);
  }

  /**
   * Check if recovery should be logged
   */
  private shouldLogRecovery(
    config: RecoveryConfig,
    strategy: RecoveryStrategy,
  ): boolean {
    return config.logRecovery && strategy !== RecoveryStrategy.NONE;
  }

  /**
   * Log recovery attempt
   */
  private logRecoveryAttempt(
    operationName: string,
    strategy: RecoveryStrategy,
    error: Error,
  ): void {
    this.logger.warn(`Attempting ${strategy} recovery for ${operationName}`, {
      error: error.message,
      errorType: error.constructor.name,
    });
  }

  /**
   * Log recovery success
   */
  private logRecoverySuccess(
    operationName: string,
    strategy: RecoveryStrategy,
    totalTime: number,
  ): void {
    this.logger.log(
      `${strategy} recovery succeeded for ${operationName} in ${totalTime}ms`,
      {
        operationName,
        strategy,
        totalTime,
      },
    );
  }

  /**
   * Log recovery failure
   */
  private logRecoveryFailure(
    operationName: string,
    strategy: RecoveryStrategy,
    error: Error,
    totalTime: number,
  ): void {
    this.logger.error(
      `${strategy} recovery failed for ${operationName} after ${totalTime}ms`,
      {
        operationName,
        strategy,
        totalTime,
        error: error.message,
        errorType: error.constructor.name,
      },
    );
  }

  /**
   * Get all recovery configurations
   */
  getAllConfigs(): Map<string, RecoveryConfig> {
    return new Map(this.recoveryConfigs);
  }

  /**
   * Reset all recovery configurations to defaults
   */
  resetAllConfigs(): void {
    this.recoveryConfigs.clear();
    this.logger.log('Reset all recovery configurations');
  }
}

// Global error recovery manager instance
export const errorRecoveryManager = new ErrorRecoveryManager();

/**
 * Recovery decorator for class methods
 */
export function Recoverable(options?: {
  operationName?: string;
  config?: Partial<RecoveryConfig>;
  fallback?: () => Promise<any>;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const operationName =
      options?.operationName || `${target.constructor.name}.${propertyKey}`;

    // Register recovery configuration
    if (options?.config) {
      errorRecoveryManager.registerRecoveryConfig(
        operationName,
        options.config,
      );
    }

    descriptor.value = async function (...args: any[]) {
      const operation = () => originalMethod.apply(this, args);

      const fallbackOperation: FallbackOperation<any> | undefined =
        options?.fallback
          ? {
              operation: () => options.fallback.apply(this, args),
              description: `Fallback for ${operationName}`,
              available: true,
            }
          : undefined;

      try {
        return await operation();
      } catch (error) {
        const recoveryResult = await errorRecoveryManager.attemptRecovery(
          operation,
          error as Error,
          operationName,
          fallbackOperation,
        );

        if (!recoveryResult.success) {
          throw recoveryResult.error;
        }

        return recoveryResult.result;
      }
    };

    return descriptor;
  };
}

/**
 * Simple recovery helper function
 */
export async function withRecovery<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallback?: () => Promise<T>,
): Promise<T> {
  const fallbackOperation: FallbackOperation<T> | undefined = fallback
    ? {
        operation: fallback,
        description: `Fallback for ${operationName}`,
        available: true,
      }
    : undefined;

  try {
    return await operation();
  } catch (error) {
    const recoveryResult = await errorRecoveryManager.attemptRecovery(
      operation,
      error as Error,
      operationName,
      fallbackOperation,
    );

    if (!recoveryResult.success) {
      throw recoveryResult.error;
    }

    return recoveryResult.result;
  }
}
