import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { BaseException } from './base.exception';
import { ERROR_CODES, getErrorCodeFromStatus, ErrorSeverity } from './error-codes';
import { ValidationException } from './domain.exceptions';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = request.headers['x-request-id'] as string | undefined;
    const correlationId = (request as any).correlationId || traceId;

    // Handle different types of exceptions
    let errorResponse: {
      code: number;
      message: string;
      errorCode: string;
      details?: Record<string, unknown>;
      traceId?: string;
      correlationId?: string;
      timestamp: string;
      path: string;
      retryable?: boolean;
      retryAfter?: number;
    };

    if (exception instanceof BaseException) {
      errorResponse = this.handleBaseException(exception, request, traceId, correlationId);
      this.logBaseException(exception, request);
    } else if (exception instanceof HttpException) {
      errorResponse = this.handleHttpException(exception, request, traceId, correlationId);
      this.logHttpException(exception, request);
    } else if (exception instanceof Error) {
      errorResponse = this.handleGenericError(exception, request, traceId, correlationId);
      this.logGenericError(exception, request);
    } else {
      errorResponse = this.handleUnknownError(exception, request, traceId, correlationId);
      this.logUnknownError(exception, request);
    }

    // Report to Sentry for monitoring
    this.reportToSentry(exception, errorResponse);

    // Send standardized error response
    response.status(errorResponse.code).json(errorResponse);
  }

  private handleBaseException(
    exception: BaseException,
    request: Request,
    traceId?: string,
    correlationId?: string,
  ) {
    return {
      code: exception.statusCode,
      message: exception.message,
      errorCode: exception.errorCode,
      details: exception.details,
      traceId,
      correlationId,
      timestamp: exception.timestamp.toISOString(),
      path: request.url,
      retryable: exception.retryable,
      retryAfter: exception.retryAfter,
    };
  }

  private handleHttpException(
    exception: HttpException,
    request: Request,
    traceId?: string,
    correlationId?: string,
  ) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    let message: string;
    let errorCode: string;
    let details: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      errorCode = getErrorCodeFromStatus(status);
    } else {
      const responseObj = exceptionResponse as Record<string, any>;
      message = responseObj.message || exception.message || 'An error occurred';
      errorCode = responseObj.errorCode || getErrorCodeFromStatus(status);
      details = responseObj.details || responseObj.errors ? { errors: responseObj.errors } : undefined;
    }

    // Map common HTTP exceptions to user-friendly messages
    if (status === HttpStatus.NOT_FOUND && !details) {
      message = 'The requested resource was not found.';
      errorCode = ERROR_CODES.NOT_FOUND;
    } else if (status === HttpStatus.UNAUTHORIZED && !details) {
      message = 'You are not authorized to access this resource.';
      errorCode = ERROR_CODES.UNAUTHORIZED;
    } else if (status === HttpStatus.FORBIDDEN && !details) {
      message = 'You do not have permission to perform this action.';
      errorCode = ERROR_CODES.FORBIDDEN;
    } else if (status === HttpStatus.BAD_REQUEST && !details) {
      message = 'The request was invalid or cannot be served.';
      errorCode = ERROR_CODES.BAD_REQUEST;
    }

    return {
      code: status,
      message,
      errorCode,
      details,
      traceId,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private handleGenericError(
    exception: Error,
    request: Request,
    traceId?: string,
    correlationId?: string,
  ) {
    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An internal server error occurred.',
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      details: this.shouldIncludeStackTrace()
        ? {
            error_type: exception.constructor.name,
            stack: exception.stack,
          }
        : undefined,
      traceId,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private handleUnknownError(
    exception: unknown,
    request: Request,
    traceId?: string,
    correlationId?: string,
  ) {
    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unknown error occurred.',
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      details: this.shouldIncludeStackTrace()
        ? {
            error_type: typeof exception === 'object' ? exception?.constructor?.name : typeof exception,
          }
        : undefined,
      traceId,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };
  }

  private logBaseException(exception: BaseException, request: Request): void {
    const logContext = {
      path: request.url,
      method: request.method,
      userId: (request as any).user?.id,
      errorCode: exception.errorCode,
      statusCode: exception.statusCode,
      severity: exception.severity,
      category: exception.category,
      retryable: exception.retryable,
      traceId: request.headers['x-request-id'],
    };

    if (exception.severity === ErrorSeverity.CRITICAL || exception.severity === ErrorSeverity.HIGH) {
      this.logger.error(
        `[${exception.errorCode}] ${exception.message}`,
        exception.stack,
        logContext,
      );
    } else if (exception.severity === ErrorSeverity.MEDIUM) {
      this.logger.warn(
        `[${exception.errorCode}] ${exception.message}`,
        logContext,
      );
    } else {
      this.logger.log(
        `[${exception.errorCode}] ${exception.message}`,
        logContext,
      );
    }
  }

  private logHttpException(exception: HttpException, request: Request): void {
    const status = exception.getStatus();
    const logContext = {
      path: request.url,
      method: request.method,
      statusCode: status,
      traceId: request.headers['x-request-id'],
    };

    if (status >= 500) {
      this.logger.error(
        `HTTP ${status}: ${exception.message}`,
        exception.stack,
        logContext,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `HTTP ${status}: ${exception.message}`,
        logContext,
      );
    }
  }

  private logGenericError(exception: Error, request: Request): void {
    this.logger.error(
      `Unhandled error: ${exception.message}`,
      exception.stack,
      {
        path: request.url,
        method: request.method,
        errorName: exception.constructor.name,
        traceId: request.headers['x-request-id'],
      },
    );
  }

  private logUnknownError(exception: unknown, request: Request): void {
    this.logger.error(
      'Unknown error type encountered',
      {
        path: request.url,
        method: request.method,
        errorType: typeof exception,
        traceId: request.headers['x-request-id'],
      },
    );
  }

  private reportToSentry(exception: unknown, errorResponse: any): void {
    // Report to Sentry for 5xx errors and critical/high severity exceptions
    const shouldReport = 
      errorResponse.code >= 500 ||
      (exception instanceof BaseException && 
       (exception.severity === ErrorSeverity.CRITICAL || 
        exception.severity === ErrorSeverity.HIGH));

    if (shouldReport) {
      Sentry.captureException(exception, {
        extra: {
          errorResponse,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  private shouldIncludeStackTrace(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  }
}
