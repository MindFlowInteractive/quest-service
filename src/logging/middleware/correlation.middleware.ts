import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { CorrelationService } from "../services/correlation.service"

interface ExtendedRequest extends Request {
  session?: { id?: string };
}

interface ExtendedResponse extends Response {
  setHeader: (name: string, value: string) => Response;
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly correlationService: CorrelationService) {}

  use(req: ExtendedRequest, res: ExtendedResponse, next: NextFunction): void {
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
