import { HttpStatus } from '@nestjs/common';
import {
  ErrorCode,
  ERROR_CODES,
  ErrorSeverity,
  ErrorCategory,
} from './error-codes';

/**
 * Base application exception with standardized error handling
 */
export abstract class BaseException extends Error {
  public readonly errorCode: ErrorCode;
  public readonly statusCode: HttpStatus;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly isOperational: boolean;
  public readonly retryable: boolean;
  public readonly retryAfter?: number; // seconds

  constructor(
    errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      details?: Record<string, unknown>;
      isOperational?: boolean;
      retryable?: boolean;
      retryAfter?: number;
      cause?: Error;
    } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.category = options.category || ErrorCategory.BUSINESS_LOGIC;
    this.details = options.details;
    this.timestamp = new Date();
    this.isOperational = options.isOperational !== false; // Default to true
    this.retryable = options.retryable || false;
    this.retryAfter = options.retryAfter;

    // Set cause if provided (available in Node.js 16.9.0+ / ES2022)
    if (options.cause) {
      (this as any).cause = options.cause;
    }

    // Capture stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Convert exception to JSON serializable format
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      errorCode: this.errorCode,
      message: this.message,
      statusCode: this.statusCode,
      severity: this.severity,
      category: this.category,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      isOperational: this.isOperational,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      stack: this.stack,
    };
  }

  /**
   * Create an HTTP-friendly response object
   */
  toHttpResponse(requestPath?: string): Record<string, unknown> {
    return {
      code: this.statusCode,
      message: this.message,
      errorCode: this.errorCode,
      timestamp: this.timestamp.toISOString(),
      path: requestPath,
      details: this.details,
      retryable: this.retryable,
      ...(this.retryAfter && { retryAfter: this.retryAfter }),
    };
  }

  /**
   * Check if this error should trigger alerting
   */
  shouldAlert(): boolean {
    return (
      this.severity === ErrorSeverity.HIGH ||
      this.severity === ErrorSeverity.CRITICAL
    );
  }

  /**
   * Check if this error should be logged
   */
  shouldLog(): boolean {
    return true; // Always log exceptions
  }
}

/**
 * Domain exception for business logic errors
 */
export abstract class DomainException extends BaseException {
  constructor(
    errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    options?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      details?: Record<string, unknown>;
      isOperational?: boolean;
      retryable?: boolean;
      retryAfter?: number;
      cause?: Error;
    },
  ) {
    super(errorCode, message, statusCode, {
      category: ErrorCategory.BUSINESS_LOGIC,
      isOperational: true,
      ...options,
    });
  }
}

/**
 * Infrastructure exception for technical failures
 */
export abstract class InfrastructureException extends BaseException {
  constructor(
    errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    options?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      details?: Record<string, unknown>;
      isOperational?: boolean;
      retryable?: boolean;
      retryAfter?: number;
      cause?: Error;
    },
  ) {
    super(errorCode, message, statusCode, {
      category: ErrorCategory.INFRASTRUCTURE,
      isOperational: false,
      ...options,
    });
  }
}
