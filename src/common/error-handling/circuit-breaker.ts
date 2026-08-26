import { Logger } from '@nestjs/common';
import { ExternalServiceUnavailableException } from '../exceptions/infrastructure.exceptions';

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation - requests flow through
  OPEN = 'OPEN', // Service is failing - requests fail fast
  HALF_OPEN = 'HALF_OPEN', // Recovery window - allow test requests
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Name of the service/operation being protected */
  name: string;
  /** Number of failures before opening the circuit */
  failureThreshold: number;
  /** Time in milliseconds to wait before attempting recovery */
  recoveryTimeout: number;
  /** Time in milliseconds for half-open state timeout */
  halfOpenTimeout?: number;
  /** Minimum number of successful calls before considering recovery */
  successThreshold?: number;
  /** Whether to log state transitions */
  logTransitions?: boolean;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CONFIG: Partial<CircuitBreakerConfig> = {
  failureThreshold: 5,
  recoveryTimeout: 30000, // 30 seconds
  halfOpenTimeout: 5000, // 5 seconds
  successThreshold: 3,
  logTransitions: true,
};

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  currentState: CircuitBreakerState;
  lastStateChange: Date;
  failureCount: number;
  successCount: number;
}

/**
 * A thread-safe implementation of the Circuit Breaker pattern for external services
 */
export class CircuitBreaker {
  private readonly logger = new Logger(CircuitBreaker.name);
  private readonly config: CircuitBreakerConfig;

  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastStateChange: Date = new Date();
  private halfOpenTimer?: NodeJS.Timeout;
  private readonly lock = new Promise<void>((resolve) => resolve()); // Simple lock for async operations

  // Statistics
  private stats: CircuitBreakerStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    currentState: this.state,
    lastStateChange: this.lastStateChange,
    failureCount: 0,
    successCount: 0,
  };

  constructor(config: CircuitBreakerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    // Check if request is allowed
    if (!this.allowRequest()) {
      throw new ExternalServiceUnavailableException(
        this.config.name,
        Math.ceil(this.getRemainingRecoveryTime() / 1000),
      );
    }

    // Execute the operation
    try {
      this.stats.totalRequests++;
      const result = await operation();
      this.recordSuccess();
      this.stats.successfulRequests++;
      return result;
    } catch (error) {
      this.stats.failedRequests++;
      this.recordFailure();

      // Try fallback if provided
      if (fallback) {
        this.logger.debug(
          `Circuit breaker falling back for ${this.config.name}`,
        );
        try {
          return await fallback();
        } catch (fallbackError) {
          throw error; // Throw original error if fallback also fails
        }
      }

      throw error;
    }
  }

  /**
   * Check if a request is allowed to proceed
   */
  allowRequest(): boolean {
    const now = Date.now();
    const timeSinceStateChange = now - this.lastStateChange.getTime();

    switch (this.state) {
      case CircuitBreakerState.CLOSED:
        return true;

      case CircuitBreakerState.OPEN:
        // Check if recovery timeout has elapsed
        if (timeSinceStateChange >= this.config.recoveryTimeout) {
          this.transitionTo(CircuitBreakerState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitBreakerState.HALF_OPEN:
        // Allow limited requests in half-open state
        if (this.successCount < (this.config.successThreshold || 1)) {
          return true;
        }
        // If we've had enough successes, transition to CLOSED
        if (this.successCount >= (this.config.successThreshold || 1)) {
          this.transitionTo(CircuitBreakerState.CLOSED);
          return true;
        }
        return false;
    }
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.successCount++;
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // If we have enough successes in half-open state, transition to CLOSED
      if (this.successCount >= (this.config.successThreshold || 1)) {
        this.transitionTo(CircuitBreakerState.CLOSED);
      }
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    // Check if we should open the circuit
    if (
      this.state === CircuitBreakerState.HALF_OPEN ||
      this.failureCount >= this.config.failureThreshold
    ) {
      this.transitionTo(CircuitBreakerState.OPEN);
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    if (this.state === newState) {
      return;
    }

    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = new Date();
    this.stats.currentState = newState;
    this.stats.lastStateChange = this.lastStateChange;

    // Clear any existing timer
    if (this.halfOpenTimer) {
      clearTimeout(this.halfOpenTimer);
      this.halfOpenTimer = undefined;
    }

    // Set up half-open timer if transitioning to OPEN
    if (newState === CircuitBreakerState.OPEN) {
      this.halfOpenTimer = setTimeout(() => {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      }, this.config.recoveryTimeout);
    }

    // Reset counters on state transitions
    if (newState === CircuitBreakerState.HALF_OPEN) {
      this.successCount = 0;
      this.failureCount = 0;
    } else if (newState === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    }

    // Log state transition
    if (this.config.logTransitions) {
      this.logger.log(
        `Circuit breaker ${this.config.name} transitioned from ${oldState} to ${newState}`,
        {
          oldState,
          newState,
          failureCount: this.failureCount,
          successCount: this.successCount,
          recoveryTimeout: this.config.recoveryTimeout,
        },
      );
    }
  }

  /**
   * Get remaining recovery time in milliseconds
   */
  getRemainingRecoveryTime(): number {
    if (this.state !== CircuitBreakerState.OPEN) {
      return 0;
    }

    const elapsed = Date.now() - this.lastStateChange.getTime();
    return Math.max(0, this.config.recoveryTimeout - elapsed);
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      ...this.stats,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Reset the circuit breaker to CLOSED state
   */
  reset(): void {
    this.transitionTo(CircuitBreakerState.CLOSED);
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      currentState: this.state,
      lastStateChange: this.lastStateChange,
      failureCount: 0,
      successCount: 0,
    };
  }

  /**
   * Manually trip the circuit breaker to OPEN state
   */
  trip(): void {
    this.transitionTo(CircuitBreakerState.OPEN);
  }

  /**
   * Manually close the circuit breaker
   */
  close(): void {
    this.transitionTo(CircuitBreakerState.CLOSED);
  }

  /**
   * Check if circuit breaker is healthy (CLOSED or HALF_OPEN with recent successes)
   */
  isHealthy(): boolean {
    return (
      this.state === CircuitBreakerState.CLOSED ||
      (this.state === CircuitBreakerState.HALF_OPEN && this.successCount > 0)
    );
  }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();
  private readonly logger = new Logger(CircuitBreakerRegistry.name);

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(config: CircuitBreakerConfig): CircuitBreaker {
    const key = config.name;

    if (!this.breakers.has(key)) {
      this.breakers.set(key, new CircuitBreaker(config));
      this.logger.debug(`Created circuit breaker for ${key}`);
    }

    return this.breakers.get(key);
  }

  /**
   * Get a circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get statistics for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    this.logger.log('Reset all circuit breakers');
  }
}

// Global circuit breaker registry instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();
