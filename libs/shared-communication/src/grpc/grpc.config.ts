import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

/**
 * gRPC service configuration
 */
export interface GrpcServiceConfig {
  name: string;
  host: string;
  port: number;
  protoPath: string;
  package: string;
  timeout?: number;
  maxRetries?: number;
  useTls?: boolean;
  tlsCert?: string;
  tlsKey?: string;
}

/**
 * Service discovery configuration
 */
export interface ServiceDiscoveryConfig {
  services: Map<string, GrpcServiceConfig>;
}

/**
 * Create gRPC client options
 */
export function createGrpcClientOptions(
  config: GrpcServiceConfig,
): GrpcOptions {
  const options: GrpcOptions = {
    transport: Transport.GRPC,
    options: {
      package: config.package,
      protoPath: config.protoPath,
      url: `${config.host}:${config.port}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
      channelOptions: {
        'grpc.max_receive_message_length': 1024 * 1024 * 100, // 100MB
        'grpc.max_send_message_length': 1024 * 1024 * 100, // 100MB
        'grpc.keepalive_time_ms': 30000,
        'grpc.keepalive_timeout_ms': 10000,
      },
    },
  };

  // Add TLS credentials if configured
  if (config.useTls && config.tlsCert && config.tlsKey) {
    options.options.credentials = {
      rootCerts: Buffer.from(config.tlsCert),
      privateKey: Buffer.from(config.tlsKey),
      certChain: Buffer.from(config.tlsCert),
    };
  }

  return options;
}

/**
 * Create gRPC server options
 */
export function createGrpcServerOptions(
  config: GrpcServiceConfig,
): GrpcOptions {
  return {
    transport: Transport.GRPC,
    options: {
      package: config.package,
      protoPath: config.protoPath,
      url: `0.0.0.0:${config.port}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
      maxReceiveMessageLength: 1024 * 1024 * 100, // 100MB
      maxSendMessageLength: 1024 * 1024 * 100, // 100MB
    },
  };
}

/**
 * Default timeout for gRPC calls (5 seconds)
 */
export const DEFAULT_GRPC_TIMEOUT = 5000;

/**
 * Default max retries for failed gRPC calls
 */
export const DEFAULT_MAX_RETRIES = 3;
