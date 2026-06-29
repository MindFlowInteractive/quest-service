import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceRegistry, ServiceDiscovery } from '@quest-service/shared';

@Injectable()
export class ServiceRegistrationService implements OnModuleInit, OnModuleDestroy {
  private serviceId: string | null = null;

  constructor(
    private readonly serviceRegistry: ServiceRegistry,
    private readonly serviceDiscovery: ServiceDiscovery,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.registerService();
  }

  async onModuleDestroy() {
    await this.unregisterService();
  }

  private async registerService() {
    const serviceName = this.configService.get<string>('SERVICE_NAME', 'unknown');
    const host = this.configService.get<string>('SERVICE_HOST', 'localhost');
    const port = this.configService.get<number>('SERVICE_PORT', 3001);
    const protocol = this.configService.get<'http' | 'grpc'>('SERVICE_PROTOCOL', 'http');

    try {
      this.serviceId = await this.serviceRegistry.registerService(
        serviceName,
        host,
        port,
        protocol,
        {
          version: this.configService.get<string>('SERVICE_VERSION', '1.0.0'),
          environment: this.configService.get<string>('NODE_ENV', 'development'),
        }
      );

      console.log(`Service registered: ${serviceName} with ID: ${this.serviceId}`);
    } catch (error) {
      console.error('Failed to register service:', error);
    }
  }

  private async unregisterService() {
    if (this.serviceId) {
      try {
        await this.serviceDiscovery.unregister(this.serviceId);
        console.log(`Service unregistered: ${this.serviceId}`);
      } catch (error) {
        console.error('Failed to unregister service:', error);
      }
    }
  }
}
