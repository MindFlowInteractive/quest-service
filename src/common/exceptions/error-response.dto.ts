import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ERROR_CODES, ErrorCode } from './error-codes';

/**
 * Standardized error response format for all API endpoints
 * Ensures consistent error envelope across the entire application
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code of the error response',
    example: 400,
  })
  code: number;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'Error code for programmatic handling',
    example: 'VALIDATION_ERROR',
    enum: Object.values(ERROR_CODES),
  })
  errorCode: ErrorCode;

  @ApiPropertyOptional({
    description: 'Optional correlation ID for tracing the error',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  traceId?: string;

  @ApiPropertyOptional({
    description: 'Correlation ID for the request',
    example: 'req_abc123',
  })
  correlationId?: string;

  @ApiPropertyOptional({
    description: 'ISO timestamp when the error occurred',
    example: '2026-01-15T10:30:00.000Z',
  })
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Request path that caused the error',
    example: '/api/v1/quests/123',
  })
  path?: string;

  @ApiPropertyOptional({
    description: 'Additional error details (validation errors, context, etc.)',
    example: { field: 'title', errors: ['must not be empty'] },
  })
  details?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Whether the operation can be retried',
    example: true,
  })
  retryable?: boolean;

  @ApiPropertyOptional({
    description: 'Suggested retry delay in seconds',
    example: 30,
  })
  retryAfter?: number;
}

/**
 * Validation error response with structured error details
 */
export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Structured validation errors',
    example: {
      title: ['must not be empty', 'must be at least 3 characters'],
      difficulty: ['must be one of: EASY, MEDIUM, HARD'],
    },
  })
  details: Record<string, string[]>;
}

/**
 * Paginated error response for batch operations
 */
export class PaginatedErrorResponseDto {
  @ApiProperty({
    description: 'List of errors from batch operation',
    type: [ErrorResponseDto],
  })
  errors: ErrorResponseDto[];

  @ApiProperty({
    description: 'Total number of errors in batch',
    example: 5,
  })
  totalErrors: number;

  @ApiProperty({
    description: 'Number of successfully processed items',
    example: 15,
  })
  successfulItems: number;

  @ApiProperty({
    description: 'Number of failed items',
    example: 5,
  })
  failedItems: number;
}

/**
 * Error metadata for monitoring and analytics
 */
export interface ErrorMetadata {
  /** Error occurrence count */
  count: number;
  /** First occurrence timestamp */
  firstSeen: Date;
  /** Last occurrence timestamp */
  lastSeen: Date;
  /** Affected user IDs */
  affectedUsers: string[];
  /** Affected endpoints */
  affectedEndpoints: string[];
  /** Error resolution status */
  resolved: boolean;
  /** Resolution timestamp if resolved */
  resolvedAt?: Date;
}

/**
 * Helper function to create standardized error responses
 */
export function createErrorResponse(
  code: number,
  message: string,
  errorCode: ErrorCode,
  options: {
    details?: Record<string, unknown>;
    traceId?: string;
    correlationId?: string;
    path?: string;
    retryable?: boolean;
    retryAfter?: number;
  } = {},
): ErrorResponseDto {
  return {
    code,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    ...options,
  };
}

/**
 * Helper function to create validation error responses
 */
export function createValidationErrorResponse(
  validationErrors: Record<string, string[]>,
  path?: string,
): ValidationErrorResponseDto {
  return {
    code: 400,
    message: 'Validation failed',
    errorCode: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
    path,
    details: validationErrors,
  };
}