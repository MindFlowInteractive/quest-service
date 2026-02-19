import { Injectable, NestMiddleware } from "@nestjs/common"
import { Request, Response, NextFunction } from "express"
import { CorrelationService } from "../services/correlation.service"

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly correlationService: CorrelationService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers["x-correlation-id"] as string) ||
      this.correlationService.generateId()

    res.setHeader("x-correlation-id", correlationId)

    this.correlationService.run(
      {
        id: correlationId,
        requestId: correlationId,
        userId: (req as any).user?.id,
      },
      () => next(),
    )
  }
}
