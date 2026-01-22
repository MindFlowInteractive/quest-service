import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { GrpcServiceOptions } from '../interfaces';

@Injectable()
export class GrpcClientService implements OnModuleInit, OnModuleDestroy {
  private clients: Map<string, any> = new Map();
  private packageDefinitions: Map<string, any> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.loadProtoFiles();
  }

  async onModuleDestroy() {
    // Close all gRPC client connections
    for (const [serviceName, client] of this.clients) {
      try {
        if (client.close) {
          client.close();
        }
      } catch (error) {
        console.error(`Error closing gRPC client for ${serviceName}:`, error);
      }
    }
    this.clients.clear();
  }

  private async loadProtoFiles() {
    const protoPath = this.configService.get<string>('PROTO_PATH', './proto');
    
    // Load social service proto
    const socialProtoPath = `${protoPath}/social.proto`;
    const socialPackageDefinition = loadSync(socialProtoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    this.packageDefinitions.set('social', socialPackageDefinition);

    // Load notification service proto
    const notificationProtoPath = `${protoPath}/notification.proto`;
    const notificationPackageDefinition = loadSync(notificationProtoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    this.packageDefinitions.set('notification', notificationPackageDefinition);
  }

  createClient(serviceName: string, options: GrpcServiceOptions): any {
    const packageDefinition = this.packageDefinitions.get(options.package);
    if (!packageDefinition) {
      throw new Error(`Proto package ${options.package} not found`);
    }

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const ServiceConstructor = this.getServiceConstructor(protoDescriptor, options.package, options.protoPath);

    const credentials = options.credentials || grpc.credentials.createInsecure();
    const client = new ServiceConstructor(options.url, credentials);

    this.clients.set(serviceName, client);
    return client;
  }

  getClient(serviceName: string): any {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`gRPC client ${serviceName} not found`);
    }
    return client;
  }

  private getServiceConstructor(protoDescriptor: any, packageName: string, protoPath: string): any {
    const parts = protoPath.split('.');
    let service = protoDescriptor[packageName];
    
    for (const part of parts) {
      if (service && service[part]) {
        service = service[part];
      }
    }

    if (!service) {
      throw new Error(`Service ${protoPath} not found in proto package ${packageName}`);
    }

    return service;
  }

  // Helper method for making gRPC calls with timeout
  async callWithTimeout<T>(
    client: any,
    methodName: string,
    request: any,
    timeout: number = 5000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeout;

      client[methodName](request, { deadline }, (error: Error, response: T) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Helper method for streaming gRPC calls
  createStream<T>(
    client: any,
    methodName: string,
    request: any
  ): grpc.ClientReadableStream<T> {
    return client[methodName](request);
  }
}
