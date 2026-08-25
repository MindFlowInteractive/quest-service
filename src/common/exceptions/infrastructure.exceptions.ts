import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, ErrorSeverity, ErrorCategory } from './error-codes';
import { InfrastructureException } from './base.exception';

// ---------------------------------------------------------------------------
// Database Exceptions
// ---------------------------------------------------------------------------

export class DatabaseException extends InfrastructureException {
  constructor(
    message: string,
    query?: string,
    parameters?: unknown[],
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.DATABASE_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.DATABASE,
        isOperational: false,
        details: { query, parameters, ...options?.details },
        ...options,
      },
    );
  }
}

export class UniqueConstraintViolationException extends InfrastructureException {
  constructor(
    table: string,
    constraint: string,
    conflictingFields: string[],
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION,
      `Unique constraint violation on table ${table}`,
      HttpStatus.CONFLICT,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.DATABASE,
        isOperational: true,
        details: { table, constraint, conflictingFields, ...options?.details },
        ...options,
      },
    );
  }
}

export class ForeignKeyViolationException extends DatabaseException {
  constructor(
    table: string,
    constraint: string,
    foreignKey: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `Foreign key violation on table ${table}`,
      undefined,
      undefined,
      {
        ...options,
        errorCode: ERROR_CODES.FOREIGN_KEY_VIOLATION,
        statusCode: HttpStatus.BAD_REQUEST,
        severity: ErrorSeverity.MEDIUM,
        isOperational: true,
        details: { table, constraint, foreignKey, ...options?.details },
      },
    );
  }
}

export class RecordNotFoundException extends DatabaseException {
  constructor(
    table: string,
    id?: string | number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `Record not found in table ${table}${id ? ` with ID ${id}` : ''}`,
      undefined,
      undefined,
      {
        ...options,
        errorCode: ERROR_CODES.RECORD_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        severity: ErrorSeverity.LOW,
        isOperational: true,
        details: { table, id, ...options?.details },
      },
    );
  }
}

// ---------------------------------------------------------------------------
// External Service Exceptions
// ---------------------------------------------------------------------------

export class ExternalServiceException extends InfrastructureException {
  constructor(
    serviceName: string,
    message: string,
    statusCode?: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
      retryable?: boolean;
      retryAfter?: number;
    },
  ) {
    super(
      ERROR_CODES.DEPENDENCY_FAILURE,
      `${serviceName}: ${message}`,
      statusCode || HttpStatus.SERVICE_UNAVAILABLE,
      {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.EXTERNAL_SERVICE,
        isOperational: false,
        retryable: options?.retryable !== false, // Default to true
        retryAfter: options?.retryAfter,
        details: { serviceName, ...options?.details },
        ...options,
      },
    );
  }
}

export class ExternalServiceUnavailableException extends ExternalServiceException {
  constructor(
    serviceName: string,
    retryAfterSeconds?: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      serviceName,
      'Service unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
      {
        ...options,
        errorCode: ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE,
        retryable: true,
        retryAfter: retryAfterSeconds,
        details: { retryAfterSeconds, ...options?.details },
      },
    );
  }
}

export class ExternalServiceTimeoutException extends ExternalServiceException {
  constructor(
    serviceName: string,
    timeoutMs: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      serviceName,
      `Request timed out after ${timeoutMs}ms`,
      HttpStatus.GATEWAY_TIMEOUT,
      {
        ...options,
        errorCode: ERROR_CODES.EXTERNAL_SERVICE_TIMEOUT,
        retryable: true,
        details: { timeoutMs, ...options?.details },
      },
    );
  }
}

export class ExternalServiceInvalidResponseException extends ExternalServiceException {
  constructor(
    serviceName: string,
    validationErrors?: string[],
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      serviceName,
      'Invalid response from service',
      HttpStatus.BAD_GATEWAY,
      {
        ...options,
        errorCode: ERROR_CODES.EXTERNAL_SERVICE_INVALID_RESPONSE,
        retryable: false, // Invalid responses typically shouldn't be retried
        details: { validationErrors, ...options?.details },
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Cache Exceptions
// ---------------------------------------------------------------------------

export class CacheException extends InfrastructureException {
  constructor(
    message: string,
    cacheKey?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
      retryable?: boolean;
    },
  ) {
    super(
      ERROR_CODES.CACHE_UNAVAILABLE,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.INFRASTRUCTURE,
        isOperational: true, // Cache failures are often operational
        retryable: options?.retryable || true,
        details: { cacheKey, ...options?.details },
        ...options,
      },
    );
  }
}

export class CacheUnavailableException extends CacheException {
  constructor(
    cacheService: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `Cache service ${cacheService} is unavailable`,
      undefined,
      {
        ...options,
        retryable: true,
        details: { cacheService, ...options?.details },
      },
    );
  }
}

export class CacheKeyNotFoundException extends CacheException {
  constructor(
    cacheKey: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `Cache key not found: ${cacheKey}`,
      cacheKey,
      {
        ...options,
        errorCode: ERROR_CODES.CACHE_KEY_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
        severity: ErrorSeverity.LOW,
        isOperational: true,
        retryable: false,
      },
    );
  }
}

// ---------------------------------------------------------------------------
// File/Storage Exceptions
// ---------------------------------------------------------------------------

export class FileUploadException extends InfrastructureException {
  constructor(
    message: string,
    fileName?: string,
    fileSize?: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      ERROR_CODES.FILE_UPLOAD_FAILED,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.INFRASTRUCTURE,
        isOperational: true,
        details: { fileName, fileSize, ...options?.details },
        ...options,
      },
    );
  }
}

export class FileTooLargeException extends FileUploadException {
  constructor(
    fileName: string,
    fileSize: number,
    maxSize: number,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `File ${fileName} exceeds maximum size of ${maxSize} bytes`,
      fileName,
      fileSize,
      {
        ...options,
        errorCode: ERROR_CODES.FILE_TOO_LARGE,
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        details: { maxSize, ...options?.details },
      },
    );
  }
}

export class InvalidFileTypeException extends FileUploadException {
  constructor(
    fileName: string,
    fileType: string,
    allowedTypes: string[],
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `File type ${fileType} is not allowed for ${fileName}`,
      fileName,
      undefined,
      {
        ...options,
        errorCode: ERROR_CODES.FILE_INVALID_TYPE,
        statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        details: { fileType, allowedTypes, ...options?.details },
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Blockchain Exceptions
// ---------------------------------------------------------------------------

export class BlockchainException extends InfrastructureException {
  constructor(
    message: string,
    network?: string,
    transactionHash?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
      retryable?: boolean;
    },
  ) {
    super(
      ERROR_CODES.BLOCKCHAIN_TRANSACTION_FAILED,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.EXTERNAL_SERVICE,
        isOperational: false,
        retryable: options?.retryable !== false, // Default to true
        details: { network, transactionHash, ...options?.details },
        ...options,
      },
    );
  }
}

export class BlockchainNetworkUnreachableException extends BlockchainException {
  constructor(
    network: string,
    endpoint?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `Blockchain network ${network} is unreachable`,
      network,
      undefined,
      {
        ...options,
        errorCode: ERROR_CODES.BLOCKCHAIN_NETWORK_UNREACHABLE,
        retryable: true,
        details: { endpoint, ...options?.details },
      },
    );
  }
}

export class BlockchainTransactionFailedException extends BlockchainException {
  constructor(
    network: string,
    transactionHash: string,
    errorCode?: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `Transaction ${transactionHash} failed on network ${network}`,
      network,
      transactionHash,
      {
        ...options,
        retryable: false, // Failed transactions typically can't be retried
        details: { errorCode, ...options?.details },
      },
    );
  }
}

export class BlockchainInsufficientFundsException extends BlockchainException {
  constructor(
    network: string,
    address: string,
    requiredAmount: string,
    currentAmount: string,
    currency: string,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(
      `Insufficient ${currency} funds for address ${address}`,
      network,
      undefined,
      {
        ...options,
        errorCode: ERROR_CODES.BLOCKCHAIN_INSUFFICIENT_FUNDS,
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        retryable: false,
        details: { address, requiredAmount, currentAmount, currency, ...options?.details },
      },
    );
  }
}