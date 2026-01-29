import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from "@nestjs/common"
import type { Observable } from "rxjs"
import { tap } from "rxjs/operators"
import type { PerformanceService } from "../services/performance.service"

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name
    const methodName = context.getHandler().name
    const operationName = `${className}.${methodName}`

    const timer = this.performanceService.startTimer(operationName)

    return next.handle().pipe(
      tap(() => {
        timer({
          className,
          methodName,
          success: true,
        })
      }),
    )
  }
}
