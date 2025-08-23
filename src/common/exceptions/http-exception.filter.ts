import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred.';
    let errorCode = 'INTERNAL_ERROR';
    let errors = undefined;

    if (exception instanceof HttpException) {
      const httpEx = exception as HttpException;
      status = httpEx.getStatus();
      const res = httpEx.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as any;
        message = r.message || message;
        errorCode = r.errorCode || errorCode;
        errors = r.errors;
      }
      // Report 5xx errors to Sentry
      if (status >= 500) {
        Sentry.captureException(exception);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Report unexpected errors to Sentry
      Sentry.captureException(exception);
    }

    // User-friendly error messages and codes for common HTTP errors
    if (status === HttpStatus.NOT_FOUND) {
      message = 'The requested resource was not found.';
      errorCode = 'NOT_FOUND';
    } else if (status === HttpStatus.UNAUTHORIZED) {
      message = 'You are not authorized to access this resource.';
      errorCode = 'UNAUTHORIZED';
    } else if (status === HttpStatus.FORBIDDEN) {
      message = 'You do not have permission to perform this action.';
      errorCode = 'FORBIDDEN';
    } else if (status === HttpStatus.BAD_REQUEST) {
      message = 'The request was invalid or cannot be served.';
      errorCode = 'BAD_REQUEST';
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      errorCode,
      errors,
    });
  }
}
