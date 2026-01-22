import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, headers } = request;
        const correlationId = request['correlationId'];
        const userAgent = headers['user-agent'] || '';
        const user = request.user?.sub || 'anonymous';

        const now = Date.now();

        this.logger.log({
            message: 'Incoming request',
            method,
            url,
            correlationId,
            user,
            userAgent,
            body: this.sanitizeBody(body),
        });

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const response = context.switchToHttp().getResponse();
                    const { statusCode } = response;
                    const responseTime = Date.now() - now;

                    this.logger.log({
                        message: 'Request completed',
                        method,
                        url,
                        statusCode,
                        responseTime: `${responseTime}ms`,
                        correlationId,
                        user,
                    });
                },
                error: (error) => {
                    const responseTime = Date.now() - now;

                    this.logger.error({
                        message: 'Request failed',
                        method,
                        url,
                        error: error.message,
                        stack: error.stack,
                        responseTime: `${responseTime}ms`,
                        correlationId,
                        user,
                    });
                },
            }),
        );
    }

    private sanitizeBody(body: any): any {
        if (!body) return body;

        const sanitized = { ...body };
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        }

        return sanitized;
    }
}
