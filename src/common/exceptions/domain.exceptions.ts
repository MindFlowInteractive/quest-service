import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, ErrorSeverity, ErrorCategory } from './error-codes';
import { DomainException } from './base.exception';

// ---------------------------------------------------------------------------
// Validation Exceptions
// ---------------------------------------------------------------------------

export class ValidationException extends DomainException {
  constructor(
    message: string,
    validationErrors?: Record<string, string[]>,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.VALIDATION_ERROR,
      message,
      HttpStatus.BAD_REQUEST,
      {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        details: validationErrors ? { errors: validationErrors } : options?.details,
        ...options,
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Resource Exceptions
// ---------------------------------------------------------------------------

export class AppNotFoundException extends DomainException {
  constructor(
    resource: string,
    id?: string | number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    
    super(
      ERROR_CODES.NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
      {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { resource, id, ...options?.details },
        ...options,
      },
    );
  }
}

export class ConflictException extends DomainException {
  constructor(
    message: string,
    resource?: string,
    conflictingField?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.CONFLICT,
      message,
      HttpStatus.CONFLICT,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { resource, conflictingField, ...options?.details },
        ...options,
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Authentication & Authorization Exceptions
// ---------------------------------------------------------------------------

export class AuthenticationException extends DomainException {
  constructor(
    message: string = 'Authentication required',
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.UNAUTHORIZED,
      message,
      HttpStatus.UNAUTHORIZED,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        ...options,
      },
    );
  }
}

export class AuthorizationException extends DomainException {
  constructor(
    message: string = 'Insufficient permissions',
    requiredPermission?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.FORBIDDEN,
      message,
      HttpStatus.FORBIDDEN,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHORIZATION,
        details: { requiredPermission, ...options?.details },
        ...options,
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Rate Limiting Exceptions
// ---------------------------------------------------------------------------

export class RateLimitException extends DomainException {
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfterSeconds?: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message,
      HttpStatus.TOO_MANY_REQUESTS,
      {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.BUSINESS_LOGIC,
        retryable: true,
        retryAfter: retryAfterSeconds,
        details: { retryAfterSeconds, ...options?.details },
        ...options,
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Quest-specific Exceptions
// ---------------------------------------------------------------------------

export class QuestNotFoundException extends AppNotFoundException {
  constructor(
    questId: string | number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super('Quest', questId, {
      ...options,
      details: { ...options?.details, errorCode: ERROR_CODES.QUEST_NOT_FOUND },
    });
  }
}

export class QuestAlreadyCompletedException extends DomainException {
  constructor(
    questId: string | number,
    playerId?: string | number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.QUEST_ALREADY_COMPLETED,
      `Quest ${questId} has already been completed${playerId ? ` by player ${playerId}` : ''}`,
      HttpStatus.CONFLICT,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { questId, playerId, ...options?.details },
        ...options,
      },
    );
  }
}

export class QuestExpiredException extends DomainException {
  constructor(
    questId: string | number,
    expiryDate?: Date,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.QUEST_EXPIRED,
      `Quest ${questId} has expired${expiryDate ? ` on ${expiryDate.toISOString()}` : ''}`,
      HttpStatus.GONE,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { questId, expiryDate, ...options?.details },
        ...options,
      },
    );
  }
}

export class QuestPrerequisiteNotMetException extends DomainException {
  constructor(
    questId: string | number,
    missingPrerequisites: string[],
    playerId?: string | number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.QUEST_PREREQUISITE_NOT_MET,
      `Player ${playerId || 'unknown'} does not meet prerequisites for quest ${questId}`,
      HttpStatus.PRECONDITION_FAILED,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { questId, playerId, missingPrerequisites, ...options?.details },
        ...options,
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Player/Game-specific Exceptions
// ---------------------------------------------------------------------------

export class PlayerNotFoundException extends AppNotFoundException {
  constructor(
    playerId: string | number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super('Player', playerId, {
      ...options,
      details: { ...options?.details, errorCode: ERROR_CODES.PLAYER_NOT_FOUND },
    });
  }
}

export class PlayerInsufficientLevelException extends DomainException {
  constructor(
    playerId: string | number,
    requiredLevel: number,
    currentLevel: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.PLAYER_INSUFFICIENT_LEVEL,
      `Player ${playerId} requires level ${requiredLevel} (current: ${currentLevel})`,
      HttpStatus.PRECONDITION_FAILED,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { playerId, requiredLevel, currentLevel, ...options?.details },
        ...options,
      },
    );
  }
}

export class PlayerInsufficientResourcesException extends DomainException {
  constructor(
    playerId: string | number,
    resourceType: string,
    requiredAmount: number,
    currentAmount: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.PLAYER_INSUFFICIENT_RESOURCES,
      `Player ${playerId} requires ${requiredAmount} ${resourceType} (current: ${currentAmount})`,
      HttpStatus.PRECONDITION_FAILED,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { playerId, resourceType, requiredAmount, currentAmount, ...options?.details },
        ...options,
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Business Logic Exceptions
// ---------------------------------------------------------------------------

export class InvalidOperationException extends DomainException {
  constructor(
    operation: string,
    reason: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.INVALID_OPERATION,
      `Operation "${operation}" is invalid: ${reason}`,
      HttpStatus.BAD_REQUEST,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { operation, reason, ...options?.details },
        ...options,
      },
    );
  }
}

export class InvalidStateException extends DomainException {
  constructor(
    entity: string,
    currentState: string,
    expectedState?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    const message = expectedState
      ? `${entity} is in state "${currentState}" but expected "${expectedState}"`
      : `${entity} is in invalid state "${currentState}"`;
    
    super(
      ERROR_CODES.INVALID_STATE,
      message,
      HttpStatus.CONFLICT,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { entity, currentState, expectedState, ...options?.details },
        ...options,
      },
    );
  }
}

export class InsufficientFundsException extends DomainException {
  constructor(
    entity: string,
    requiredAmount: number,
    currentAmount: number,
    currency?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.INSUFFICIENT_FUNDS,
      `${entity} requires ${requiredAmount} ${currency || 'units'} (current: ${currentAmount})`,
      HttpStatus.PAYMENT_REQUIRED,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        details: { entity, requiredAmount, currentAmount, currency, ...options?.details },
        ...options,
      },
    );
  }
}

export class TimeoutException extends DomainException {
  constructor(
    operation: string,
    timeoutMs: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.TIMEOUT,
      `Operation "${operation}" timed out after ${timeoutMs}ms`,
      HttpStatus.GATEWAY_TIMEOUT,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.BUSINESS_LOGIC,
        retryable: true,
        details: { operation, timeoutMs, ...options?.details },
        ...options,
      },
    );
  }
}