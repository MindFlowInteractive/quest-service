import { DynamicModule, Module } from '@nestjs/common';
import { GrpcClientService } from './grpc-client.service';
import { ServiceDiscoveryConfig } from './grpc.config';

@Module({})
export class GrpcModule {
  /**
   * Register gRPC module with service discovery
   */
  static register(config: ServiceDiscoveryConfig): DynamicModule {
    return {
      module: GrpcModule,
      providers: [
        {
          provide: 'GRPC_SERVICE_DISCOVERY_CONFIG',
          useValue: config,
        },
        {
          provide: GrpcClientService,
          useFactory: () => {
            const clientService = new GrpcClientService();
            
            // Register all services from config
            for (const [serviceName, serviceConfig] of config.services.entries()) {
              clientService.registerService(serviceName, serviceConfig);
            }
            
            return clientService;
          },
        },
      ],
      exports: [GrpcClientService],
      global: true,
    };
  }
}
