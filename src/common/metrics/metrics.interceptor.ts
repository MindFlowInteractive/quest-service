import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const { method, url } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = response.statusCode.toString();
          const route = this.extractRoute(url);

          this.metricsService.incrementHttpRequests(method, route, statusCode);
          this.metricsService.recordHttpRequestDuration(method, route, statusCode, duration);
        },
        error: () => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = response.statusCode?.toString() || '500';
          const route = this.extractRoute(url);

          this.metricsService.incrementHttpRequests(method, route, statusCode);
          this.metricsService.recordHttpRequestDuration(method, route, statusCode, duration);
        },
      }),
    );
  }

  private extractRoute(url: string): string {
    // Extract route from URL, removing query parameters and IDs
    const route = url.split('?')[0];
    
    // Replace numeric IDs with placeholder
    return route.replace(/\/\d+/g, '/:id');
  }
}
