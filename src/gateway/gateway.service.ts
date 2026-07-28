import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { RouterService } from './router/router.service';

export interface GatewayRequest {
  service: string;
  path: string;
  method: string;
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
}

@Injectable()
export class GatewayService {
  constructor(
    private readonly routerService: RouterService,
  ) {}

  async forwardRequest(
    request: GatewayRequest,
  ): Promise<unknown> {
    const destination =
      this.routerService.resolveService(
        request.service,
      );

    if (!destination) {
      throw new NotFoundException(
        `Unknown service: ${request.service}`,
      );
    }

    return this.routerService.forward(
      destination,
      request,
    );
  }
}