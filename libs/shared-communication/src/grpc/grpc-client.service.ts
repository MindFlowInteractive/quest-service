import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry, catchError } from 'rxjs';
import {
  GrpcServiceConfig,
  createGrpcClientOptions,
  DEFAULT_GRPC_TIMEOUT,
  DEFAULT_MAX_RETRIES,
} from './grpc.config';

/**
 * Generic gRPC client service with automatic retry and timeout handling
 */
@Injectable()
export class GrpcClientService implements OnModuleInit {
  private readonly logger = new Logger(GrpcClientService.name);
  private readonly clients = new Map<string, ClientGrpc>();
  private readonly serviceConfigs = new Map<string, GrpcServiceConfig>();

  async onModuleInit(): Promise<void> {
    // Initialize all registered clients
    for (const [serviceName, config] of this.serviceConfigs.entries()) {
      await this.initializeClient(serviceName, config);
    }
  }

  /**
   * Register a gRPC service client
   */
  registerService(serviceName: string, config: GrpcServiceConfig): void {
    this.serviceConfigs.set(serviceName, config);
  }

  /**
   * Initialize a gRPC client
   */
  private async initializeClient(
    serviceName: string,
    config: GrpcServiceConfig,
  ): Promise<void> {
    try {
      const options = createGrpcClientOptions(config);
      const client = ClientProxyFactory.create(options) as ClientGrpc;

      await client.connect();
      this.clients.set(serviceName, client);

      this.logger.log(
        `gRPC client initialized for service: ${serviceName} at ${config.host}:${config.port}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize gRPC client for ${serviceName}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a gRPC service client
   */
  getService<T>(serviceName: string, serviceInterface: string): T {
    const client = this.clients.get(serviceName);
    
    if (!client) {
      throw new Error(`gRPC client not found for service: ${serviceName}`);
    }

    return client.getService<T>(serviceInterface);
  }

  /**
   * Call a gRPC method with automatic retry and timeout
   */
  async call<TRequest, TResponse>(
    serviceName: string,
    serviceInterface: string,
    method: string,
    data: TRequest,
    options?: {
      timeout?: number;
      maxRetries?: number;
    },
  ): Promise<TResponse> {
    const service = this.getService<any>(serviceName, serviceInterface);
    const config = this.serviceConfigs.get(serviceName);

    const timeoutMs = options?.timeout || config?.timeout || DEFAULT_GRPC_TIMEOUT;
    const maxRetries = options?.maxRetries || config?.maxRetries || DEFAULT_MAX_RETRIES;

    this.logger.debug(
      `Calling gRPC method: ${serviceName}.${serviceInterface}.${method}`,
    );

    try {
      const result = await firstValueFrom(
        service[method](data).pipe(
          timeout(timeoutMs),
          retry({
            count: maxRetries,
            delay: (error, retryCount) => {
              this.logger.warn(
                `Retrying gRPC call ${serviceName}.${method} (attempt ${retryCount}/${maxRetries})`,
              );
              return retryCount * 1000; // Linear backoff
            },
          }),
          catchError((error) => {
            this.logger.error(
              `gRPC call failed: ${serviceName}.${method}`,
              error.stack,
            );
            throw error;
          }),
        ),
      );

      this.logger.debug(
        `gRPC call successful: ${serviceName}.${serviceInterface}.${method}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `gRPC call failed after ${maxRetries} retries: ${serviceName}.${method}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check if a service is available
   */
  isServiceAvailable(serviceName: string): boolean {
    return this.clients.has(serviceName);
  }

  /**
   * Close all gRPC connections
   */
  async closeAll(): Promise<void> {
    for (const [serviceName, client] of this.clients.entries()) {
      await client.close();
      this.logger.log(`Closed gRPC client for service: ${serviceName}`);
    }
    this.clients.clear();
  }
}
