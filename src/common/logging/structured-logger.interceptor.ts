import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface StructuredLog {
  timestamp: string;
  traceId: string;
  spanId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  service: string;
  method: string;
  url: string;
  statusCode?: number;
  userId?: string;
  requestId?: string;
  duration?: number;
  error?: any;
  metadata?: any;
}

@Injectable()
export class StructuredLoggerInterceptor implements NestInterceptor {
  private serviceName = process.env.SERVICE_NAME || 'quest-service';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const traceId = this.getTraceId(request);
    const spanId = uuidv4();
    const requestId = uuidv4();

    const { method, url } = request;

    // Add trace context to request for use in controllers
    request['traceId'] = traceId;
    request['spanId'] = spanId;
    request['requestId'] = requestId;

    this.log({
      timestamp: new Date().toISOString(),
      traceId,
      spanId,
      level: 'info',
      message: 'Request started',
      service: this.serviceName,
      method,
      url,
      userId: this.extractUserId(request),
      requestId,
      metadata: {
        userAgent: request.get('user-agent'),
        ip: request.ip,
      },
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.log({
            timestamp: new Date().toISOString(),
            traceId,
            spanId,
            level: 'info',
            message: 'Request completed',
            service: this.serviceName,
            method,
            url,
            statusCode,
            userId: this.extractUserId(request),
            requestId,
            duration,
            metadata: {
              responseSize: JSON.stringify(data).length,
            },
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          this.log({
            timestamp: new Date().toISOString(),
            traceId,
            spanId,
            level: 'error',
            message: 'Request failed',
            service: this.serviceName,
            method,
            url,
            statusCode,
            userId: this.extractUserId(request),
            requestId,
            duration,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          });
        },
      }),
    );
  }

  private getTraceId(request: Request): string {
    return (
      request.headers['x-trace-id'] as string ||
      request.headers['x-request-id'] as string ||
      uuidv4()
    );
  }

  private extractUserId(request: Request): string | undefined {
    // Try to extract user ID from various sources
    return (
      (request.user as any)?.id ||
      request.headers['x-user-id'] as string ||
      request.query.userId as string
    );
  }

  private log(logEntry: StructuredLog): void {
    // In production, this would be sent to Logstash/Elasticsearch
    // For now, we'll use console with structured format
    const logOutput = JSON.stringify(logEntry);
    
    if (logEntry.level === 'error') {
      console.error(logOutput);
    } else if (logEntry.level === 'warn') {
      console.warn(logOutput);
    } else {
      console.log(logOutput);
    }
  }
}
