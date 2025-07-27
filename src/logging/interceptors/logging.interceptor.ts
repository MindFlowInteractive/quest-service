import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler, Logger } from "@nestjs/common"
import { type Observable, throwError } from "rxjs"
import { tap, catchError } from "rxjs/operators"
import type { LoggingService } from "../services/logging.service"
import type { MetricsService } from "../services/metrics.service"

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  constructor(
    private readonly loggingService: LoggingService,
    private readonly metricsService: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const className = context.getClass().name
    const methodName = context.getHandler().name
    const startTime = Date.now()

    this.loggingService.debug(`Executing ${className}.${methodName}`, {
      className,
      methodName,
      args: request.body,
    })

    return next.handle().pipe(
      tap((result) => {
        const duration = Date.now() - startTime
        this.loggingService.debug(`Completed ${className}.${methodName} in ${duration}ms`, {
          className,
          methodName,
          duration,
          resultType: typeof result,
        })
      }),
      catchError((error) => {
        const duration = Date.now() - startTime
        this.metricsService.recordError("method_execution", "high")

        this.loggingService.error(`Error in ${className}.${methodName}`, error.stack, {
          className,
          methodName,
          duration,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        })

        return throwError(() => error)
      }),
    )
  }
}
