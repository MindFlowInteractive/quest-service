import { Injectable, type NestMiddleware } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"
import type { CorrelationService } from "../services/correlation.service"

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly correlationService: CorrelationService) { }

  use(req: any, res: any, next: any): void {
    const correlationId = (req.headers["x-correlation-id"] as string) || this.correlationService.generateId()

    // Set correlation ID in response header
    res.setHeader("x-correlation-id", correlationId)

    // Run the request in correlation context
    this.correlationService.run(
      {
        id: correlationId,
        requestId: req.headers["x-request-id"] as string,
        sessionId: req.session?.id,
      },
      () => next(),
    )
  }
}
