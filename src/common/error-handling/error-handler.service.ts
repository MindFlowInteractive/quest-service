import { Injectable, Logger } from '@nestjs/common';
import { BaseException } from '../exceptions/base.exception';
import {
  ERROR_CODES,
  ErrorSeverity,
  ErrorCategory,
} from '../exceptions/error-codes';
import { CircuitBreaker, circuitBreakerRegistry } from './circuit-breaker';
import { RetryStrategy, retryStrategyRegistry } from './retry-strategy';
import { ErrorRecoveryManager, errorRecoveryManager } from './error-recovery';

/**
 * Error handling context
 */
export interface ErrorContext {
  /** Operation being performed */
  operation: string;
  /** User ID if available */
  userId?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Additional context data */
  metadata?: Record<string, unknown>;
}

/**
 * Error handling options
 */
export interface ErrorHandlingOptions {
  /** Whether to attempt recovery */
  attemptRecovery: boolean;
  /** Whether to log the error */
  logError: boolean;
  /** Whether to report to monitoring */
  reportToMonitoring: boolean;
  /** Whether to notify stakeholders */
  notifyStakeholders: boolean;
  /** Recovery timeout in milliseconds */
  recoveryTimeout?: number;
}

/**
 * Main error handler service that orchestrates all error handling components
 */
@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);

  private readonly circuitBreakerRegistry = circuitBreakerRegistry;
  private readonly retryStrategyRegistry = retryStrategyRegistry;
  private readonly errorRecoveryManager = errorRecoveryManager;

  constructor() {
    this.initializeDefaultConfigurations();
  }

  /**
   * Initialize default error handling configurations
   */
  private initializeDefaultConfigurations(): void {
    // Register default recovery configurations
    this.errorRecoveryManager.registerRecoveryConfig('external-api-call', {
      primaryStrategy: 'CIRCUIT_BREAKER',
      fallbackStrategy: 'RETRY',
      maxRecoveryAttempts: 3,
      recoveryTimeout: 30000,
    });

    this.errorRecoveryManager.registerRecoveryConfig('database-operation', {
      primaryStrategy: 'RETRY',
      fallbackStrategy: 'QUEUE_AND_RETRY',
      maxRecoveryAttempts: 5,
      recoveryTimeout: 60000,
    });

    this.errorRecoveryManager.registerRecoveryConfig('file-upload', {
      primaryStrategy: 'RETRY',
      fallbackStrategy: 'DEGRADE',
      maxRecoveryAttempts: 2,
      recoveryTimeout: 15000,
    });

    this.logger.log('Initialized default error handling configurations');
  }

  /**
   * Handle an error with full error handling pipeline
   */
  async handleError<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: Partial<ErrorHandlingOptions> = {},
  ): Promise<T> {
    const fullOptions: ErrorHandlingOptions = {
      attemptRecovery: true,
      logError: true,
      reportToMonitoring: true,
      notifyStakeholders: false,
      ...options,
    };

    try {
      // Execute the operation with error handling
      return await this.executeWithErrorHandling(
        operation,
        context,
        fullOptions,
      );
    } catch (error) {
      // Final error handling after all recovery attempts
      await this.handleFinalError(error as Error, context, fullOptions);
      throw error;
    }
  }

  /**
   * Execute operation with error handling
   */
  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: ErrorHandlingOptions,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Execute the operation
      const result = await operation();
      const duration = Date.now() - startTime;

      // Log successful operation if it took a long time
      if (duration > 5000) {
        // 5 seconds
        this.logger.warn(`Operation ${context.operation} took ${duration}ms`, {
          ...context,
          duration,
        });
      }

      return result;
    } catch (error) {
      const errorObj = error as Error;
      const duration = Date.now() - startTime;

      // Log the error
      if (options.logError) {
        this.logError(errorObj, context, duration);
      }

      // Report to monitoring
      if (options.reportToMonitoring) {
        this.reportToMonitoring(errorObj, context);
      }

      // Attempt recovery
      if (options.attemptRecovery) {
        const recoveryResult = await this.attemptRecovery(
          operation,
          errorObj,
          context,
          options,
        );

        if (recoveryResult.success) {
          this.logger.log(`Recovery succeeded for ${context.operation}`, {
            ...context,
            recoveryStrategy: recoveryResult.strategy,
            totalTime: recoveryResult.totalTime,
          });

          return recoveryResult.result;
        }
      }

      // Notify stakeholders if configured
      if (
        options.notifyStakeholders &&
        this.shouldNotifyStakeholders(errorObj)
      ) {
        this.notifyStakeholders(errorObj, context);
      }

      throw errorObj;
    }
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery<T>(
    operation: () => Promise<T>,
    error: Error,
    context: ErrorContext,
    options: ErrorHandlingOptions,
  ) {
    const fallbackOperation = this.getFallbackOperation(operation, context);

    return this.errorRecoveryManager.attemptRecovery(
      operation,
      error,
      context.operation,
      fallbackOperation,
    );
  }

  /**
   * Get fallback operation for a given context
   */
  private getFallbackOperation<T>(
    originalOperation: () => Promise<T>,
    context: ErrorContext,
  ) {
    // Default fallback: rethrow the error
    return {
      operation: async () => {
        throw new Error(
          `Fallback operation for ${context.operation} not implemented`,
        );
      },
      description: `Default fallback for ${context.operation}`,
      available: false,
    };
  }

  /**
   * Log error with context
   */
  private logError(
    error: Error,
    context: ErrorContext,
    duration: number,
  ): void {
    const logContext = {
      ...context,
      duration,
      errorName: error.constructor.name,
      errorMessage: error.message,
      stack: error.stack,
    };

    if (error instanceof BaseException) {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          this.logger.error(
            `[${error.errorCode}] ${error.message}`,
            error.stack,
            logContext,
          );
          break;
        case ErrorSeverity.MEDIUM:
          this.logger.warn(`[${error.errorCode}] ${error.message}`, logContext);
          break;
        case ErrorSeverity.LOW:
          this.logger.log(`[${error.errorCode}] ${error.message}`, logContext);
          break;
      }
    } else {
      // Generic error logging
      this.logger.error(
        `Unhandled error: ${error.message}`,
        error.stack,
        logContext,
      );
    }
  }

  /**
   * Report error to monitoring systems
   */
  private reportToMonitoring(error: Error, context: ErrorContext): void {
    // In a real implementation, this would integrate with:
    // - Sentry
    // - DataDog
    // - New Relic
    // - Custom monitoring solutions

    const monitoringData = {
      timestamp: new Date().toISOString(),
      ...context,
      error: {
        name: error.constructor.name,
        message: error.message,
        ...(error instanceof BaseException && {
          errorCode: error.errorCode,
          severity: error.severity,
          category: error.category,
          retryable: error.retryable,
        }),
      },
    };

    this.logger.debug('Reporting error to monitoring systems', monitoringData);
  }

  /**
   * Handle final error after all recovery attempts
   */
  private async handleFinalError(
    error: Error,
    context: ErrorContext,
    options: ErrorHandlingOptions,
  ): Promise<void> {
    // Update circuit breaker statistics
    this.updateCircuitBreakerStats(error, context.operation);

    // Update retry strategy statistics
    this.updateRetryStrategyStats(error, context.operation);

    // Log final error state
    this.logger.error(`All error handling exhausted for ${context.operation}`, {
      ...context,
      error: error.message,
      errorType: error.constructor.name,
    });
  }

  /**
   * Update circuit breaker statistics
   */
  private updateCircuitBreakerStats(error: Error, operationName: string): void {
    const circuitBreaker = this.circuitBreakerRegistry.get(operationName);
    if (circuitBreaker) {
      if (this.isCircuitBreakerError(error)) {
        circuitBreaker.recordFailure();
      } else {
        circuitBreaker.recordSuccess();
      }
    }
  }

  /**
   * Update retry strategy statistics
   */
  private updateRetryStrategyStats(error: Error, operationName: string): void {
    const retryStrategy = this.retryStrategyRegistry.get(operationName);
    if (retryStrategy) {
      // Statistics are already updated within the retry strategy
      // This is just a placeholder for additional logic
    }
  }

  /**
   * Check if error should trigger stakeholder notifications
   */
  private shouldNotifyStakeholders(error: Error): boolean {
    if (error instanceof BaseException) {
      return (
        error.severity === ErrorSeverity.CRITICAL ||
        error.severity === ErrorSeverity.HIGH
      );
    }

    // Notify for certain error types
    const criticalErrors = [
      'DatabaseException',
      'ExternalServiceException',
      'SecurityException',
    ];

    return criticalErrors.includes(error.constructor.name);
  }

  /**
   * Notify stakeholders about critical errors
   */
  private notifyStakeholders(error: Error, context: ErrorContext): void {
    // In a real implementation, this would:
    // - Send emails
    // - Send Slack/Teams notifications
    // - Create incident tickets
    // - Page on-call engineers

    const notificationData = {
      timestamp: new Date().toISOString(),
      severity: error instanceof BaseException ? error.severity : 'HIGH',
      operation: context.operation,
      error: error.message,
      errorType: error.constructor.name,
      userId: context.userId,
      requestId: context.requestId,
      ...context.metadata,
    };

    this.logger.warn('Stakeholder notification triggered', notificationData);
  }

  /**
   * Check if error is a circuit breaker error
   */
  private isCircuitBreakerError(error: Error): boolean {
    const circuitBreakerErrors = [
      'ExternalServiceUnavailableException',
      'ExternalServiceTimeoutException',
      'TimeoutException',
    ];

    return circuitBreakerErrors.includes(error.constructor.name);
  }

  /**
   * Get error handling statistics
   */
  getStatistics() {
    return {
      circuitBreakers: this.circuitBreakerRegistry.getAllStats(),
      retryStrategies: this.retryStrategyRegistry.getAllStats(),
      recoveryConfigs: Object.fromEntries(
        this.errorRecoveryManager.getAllConfigs(),
      ),
    };
  }

  /**
   * Reset all error handling statistics
   */
  resetStatistics(): void {
    this.circuitBreakerRegistry.resetAll();
    this.retryStrategyRegistry.resetAll();
    this.errorRecoveryManager.resetAllConfigs();

    this.logger.log('Reset all error handling statistics');
  }

  /**
   * Health check for error handling system
   */
  healthCheck() {
    const circuitBreakers = Array.from(
      this.circuitBreakerRegistry.getAll().values(),
    );
    const unhealthyBreakers = circuitBreakers.filter((cb) => !cb.isHealthy());

    return {
      status: unhealthyBreakers.length === 0 ? 'HEALTHY' : 'DEGRADED',
      circuitBreakers: {
        total: circuitBreakers.length,
        healthy: circuitBreakers.length - unhealthyBreakers.length,
        unhealthy: unhealthyBreakers.length,
        unhealthyServices: unhealthyBreakers.map((cb) => cb.getStats()),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create error context from request
   */
  createContextFromRequest(request: any, operation: string): ErrorContext {
    return {
      operation,
      userId: request.user?.id,
      requestId: request.headers['x-request-id'],
      metadata: {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    };
  }
}
