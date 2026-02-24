import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceService } from './performance.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(private performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const route = request.url;
    const startTime = Date.now();

    this.performanceService.incrementActiveRequests();

    return next.handle().pipe(
      tap({
        finalize: () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          // Record API response time
          this.performanceService.recordApiResponseTime(method, route, statusCode, duration);

          this.performanceService.decrementActiveRequests();

          // Log performance data
          this.logger.log(
            `${method} ${route} ${statusCode} - ${duration}ms`,
          );

          // Check for slow API responses (threshold: 500ms)
          if (duration > 500) {
            this.logger.warn(
              `Slow API response detected: ${method} ${route} took ${duration}ms`,
            );
          }
        },
      }),
    );
  }
}