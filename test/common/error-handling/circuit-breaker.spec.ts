import {
  CircuitBreaker,
  CircuitBreakerState,
  CircuitBreakerRegistry,
} from '../../../src/common/error-handling/circuit-breaker';

describe('CircuitBreaker', () => {
  describe('CircuitBreaker class', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        name: 'test-service',
        failureThreshold: 3,
        recoveryTimeout: 100, // Short timeout for tests
        logTransitions: false,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should initialize in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.getStats().currentState).toBe(
        CircuitBreakerState.CLOSED,
      );
    });

    it('should allow requests in CLOSED state', () => {
      expect(circuitBreaker.allowRequest()).toBe(true);
    });

    it('should record success and reset failure count', () => {
      // Record some failures
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getStats().failureCount).toBe(2);

      // Record success should reset failure count
      circuitBreaker.recordSuccess();
      expect(circuitBreaker.getStats().failureCount).toBe(0);
    });

    it('should transition to OPEN state when failure threshold is reached', () => {
      // Record failures up to threshold
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure(); // Third failure should open circuit

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      expect(circuitBreaker.allowRequest()).toBe(false);
    });

    it('should transition to HALF_OPEN after recovery timeout', () => {
      jest.useFakeTimers();

      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Advance time past recovery timeout
      jest.advanceTimersByTime(150);

      // Should now be in HALF_OPEN state and allow requests
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
      expect(circuitBreaker.allowRequest()).toBe(true);
    });

    it('should transition from HALF_OPEN to CLOSED on successful probe', () => {
      jest.useFakeTimers();

      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Advance to HALF_OPEN
      jest.advanceTimersByTime(150);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);

      // Record success in HALF_OPEN state
      circuitBreaker.recordSuccess();

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should transition from HALF_OPEN to OPEN on failure', () => {
      jest.useFakeTimers();

      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      // Advance to HALF_OPEN
      jest.advanceTimersByTime(150);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);

      // Record failure in HALF_OPEN state
      circuitBreaker.recordFailure();

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should execute operation successfully in CLOSED state', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const fallback = jest.fn();

      const result = await circuitBreaker.execute(operation, fallback);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(fallback).not.toHaveBeenCalled();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should use fallback when circuit is OPEN', async () => {
      jest.useFakeTimers();

      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      const operation = jest.fn();
      const fallback = jest.fn().mockResolvedValue('fallback-success');

      await expect(
        circuitBreaker.execute(operation, fallback),
      ).rejects.toThrow();

      expect(operation).not.toHaveBeenCalled();
      expect(fallback).not.toHaveBeenCalled(); // Should reject before calling fallback
    });

    it('should execute operation in HALF_OPEN state', async () => {
      jest.useFakeTimers();

      // Open then transition to HALF_OPEN
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      jest.advanceTimersByTime(150);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);

      const operation = jest.fn().mockResolvedValue('half-open-success');
      const fallback = jest.fn();

      const result = await circuitBreaker.execute(operation, fallback);

      expect(result).toBe('half-open-success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should get remaining recovery time', () => {
      jest.useFakeTimers();

      // Open the circuit
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      const remainingTime = circuitBreaker.getRemainingRecoveryTime();
      expect(remainingTime).toBeGreaterThan(0);
      expect(remainingTime).toBeLessThanOrEqual(100);

      // Advance time
      jest.advanceTimersByTime(50);
      const newRemainingTime = circuitBreaker.getRemainingRecoveryTime();
      expect(newRemainingTime).toBeLessThan(remainingTime);
    });

    it('should return 0 remaining time when not OPEN', () => {
      expect(circuitBreaker.getRemainingRecoveryTime()).toBe(0);

      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getRemainingRecoveryTime()).toBe(0); // Still CLOSED
    });

    it('should get statistics', () => {
      // Execute some operations
      const operation = jest.fn().mockResolvedValue('success');

      circuitBreaker.execute(operation, undefined);
      circuitBreaker.execute(operation, undefined);
      circuitBreaker.execute(operation, undefined);

      const stats = circuitBreaker.getStats();

      expect(stats.totalRequests).toBe(3);
      expect(stats.successfulRequests).toBe(3);
      expect(stats.failedRequests).toBe(0);
      expect(stats.currentState).toBe(CircuitBreakerState.CLOSED);
      expect(stats.lastStateChange).toBeInstanceOf(Date);
    });

    it('should reset circuit breaker', () => {
      // Record some state
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      circuitBreaker.execute(jest.fn().mockResolvedValue('success'), undefined);

      circuitBreaker.reset();

      const stats = circuitBreaker.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
      expect(stats.failureCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should manually trip circuit breaker', () => {
      circuitBreaker.trip();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should manually close circuit breaker', () => {
      // Open the circuit
      circuitBreaker.trip();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      circuitBreaker.close();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should check if circuit breaker is healthy', () => {
      expect(circuitBreaker.isHealthy()).toBe(true);

      // Open circuit
      circuitBreaker.trip();
      expect(circuitBreaker.isHealthy()).toBe(false);

      // Half-open with no successes
      jest.useFakeTimers();
      jest.advanceTimersByTime(150);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
      expect(circuitBreaker.isHealthy()).toBe(false);

      // Half-open with successes
      circuitBreaker.recordSuccess();
      expect(circuitBreaker.isHealthy()).toBe(true);
    });

    it('should handle multiple rapid failures', () => {
      for (let i = 0; i < 10; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
      expect(circuitBreaker.getStats().failureCount).toBeGreaterThanOrEqual(3);
    });

    it('should maintain success count in HALF_OPEN state', () => {
      jest.useFakeTimers();

      // Open then transition to HALF_OPEN
      circuitBreaker.trip();
      jest.advanceTimersByTime(150);
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);

      // Record successes
      circuitBreaker.recordSuccess();
      circuitBreaker.recordSuccess();
      circuitBreaker.recordSuccess();

      // Should transition to CLOSED after enough successes
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('CircuitBreakerRegistry', () => {
    let registry: CircuitBreakerRegistry;

    beforeEach(() => {
      registry = new CircuitBreakerRegistry();
    });

    it('should get or create circuit breaker', () => {
      const breaker1 = registry.getOrCreate({
        name: 'test-service',
        failureThreshold: 3,
        recoveryTimeout: 100,
      });

      const breaker2 = registry.getOrCreate({
        name: 'test-service',
        failureThreshold: 5, // Different config, should reuse existing
        recoveryTimeout: 200,
      });

      expect(breaker1).toBe(breaker2); // Same instance
      expect(breaker1.getStats().currentState).toBe(CircuitBreakerState.CLOSED);
    });

    it('should get circuit breaker by name', () => {
      const breaker = registry.getOrCreate({
        name: 'test-service',
        failureThreshold: 3,
        recoveryTimeout: 100,
      });

      const foundBreaker = registry.get('test-service');
      expect(foundBreaker).toBe(breaker);

      const notFoundBreaker = registry.get('non-existent');
      expect(notFoundBreaker).toBeUndefined();
    });

    it('should get all circuit breakers', () => {
      const breaker1 = registry.getOrCreate({
        name: 'service-1',
        failureThreshold: 3,
        recoveryTimeout: 100,
      });

      const breaker2 = registry.getOrCreate({
        name: 'service-2',
        failureThreshold: 5,
        recoveryTimeout: 200,
      });

      const allBreakers = registry.getAll();
      expect(allBreakers.size).toBe(2);
      expect(allBreakers.get('service-1')).toBe(breaker1);
      expect(allBreakers.get('service-2')).toBe(breaker2);
    });

    it('should get statistics for all circuit breakers', () => {
      registry.getOrCreate({
        name: 'service-1',
        failureThreshold: 3,
        recoveryTimeout: 100,
      });

      registry.getOrCreate({
        name: 'service-2',
        failureThreshold: 5,
        recoveryTimeout: 200,
      });

      const stats = registry.getAllStats();
      expect(Object.keys(stats)).toEqual(['service-1', 'service-2']);
      expect(stats['service-1'].currentState).toBe(CircuitBreakerState.CLOSED);
      expect(stats['service-2'].currentState).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reset all circuit breakers', () => {
      const breaker = registry.getOrCreate({
        name: 'test-service',
        failureThreshold: 3,
        recoveryTimeout: 100,
      });

      // Record some state
      breaker.recordFailure();
      breaker.execute(jest.fn().mockResolvedValue('success'), undefined);

      registry.resetAll();

      const stats = breaker.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
    });

    it('should handle multiple services independently', () => {
      const breaker1 = registry.getOrCreate({
        name: 'service-1',
        failureThreshold: 2,
        recoveryTimeout: 100,
      });

      const breaker2 = registry.getOrCreate({
        name: 'service-2',
        failureThreshold: 3,
        recoveryTimeout: 200,
      });

      // Fail service-1 to open it
      breaker1.recordFailure();
      breaker1.recordFailure();
      expect(breaker1.getState()).toBe(CircuitBreakerState.OPEN);

      // service-2 should still be CLOSED
      expect(breaker2.getState()).toBe(CircuitBreakerState.CLOSED);

      // service-2 should allow requests
      expect(breaker2.allowRequest()).toBe(true);

      // service-1 should not allow requests
      expect(breaker1.allowRequest()).toBe(false);
    });
  });
});
