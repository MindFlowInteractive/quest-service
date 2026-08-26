import { Injectable } from '@nestjs/common';

import { ServiceDefinition } from './service-registry';
import { RouteResolver } from './route-resolver';
import { GatewayRequest } from '../gateway.service';

@Injectable()
export class RouterService {
  constructor(private readonly routeResolver: RouteResolver) {}

  resolveService(service: string): ServiceDefinition {
    return this.routeResolver.resolve(service);
  }

  async forward(
    destination: ServiceDefinition,
    request: GatewayRequest,
  ): Promise<unknown> {
    /**
     * Phase 2 will replace this with:
     * - Authentication
     * - Correlation IDs
     * - Circuit Breaker
     * - Request Transformation
     * - Native fetch/HTTP forwarding
     */

    return {
      gateway: true,
      service: destination.name,
      destination: destination.baseUrl,
      method: request.method,
      path: request.path,
      query: request.query,
      body: request.body,
      status: 'Request routing scaffolded',
    };
  }
}
