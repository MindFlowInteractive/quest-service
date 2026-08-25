import { Injectable, NotFoundException } from '@nestjs/common';

import { SERVICE_REGISTRY, ServiceDefinition } from './service-registry';

@Injectable()
export class RouteResolver {
  resolve(service: string): ServiceDefinition {
    const definition = SERVICE_REGISTRY[service];

    if (!definition || !definition.enabled) {
      throw new NotFoundException(`Service "${service}" is unavailable.`);
    }

    return definition;
  }
}
