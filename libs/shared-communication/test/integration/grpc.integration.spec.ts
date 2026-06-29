import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller } from '@nestjs/common';
import { GrpcMethod, GrpcModule as NestGrpcModule } from '@nestjs/microservices';
import { GrpcModule, GrpcClientService, createGrpcServerOptions } from '../../src';
import { join } from 'path';

// Mock service implementation
@Controller()
class TestGrpcController {
  @GrpcMethod('TestService', 'SayHello')
  sayHello(data: { name: string }): { message: string } {
    return { message: `Hello ${data.name}!` };
  }

  @GrpcMethod('TestService', 'GetUser')
  getUser(data: { id: string }): { id: string; name: string; email: string } {
    return {
      id: data.id,
      name: 'Test User',
      email: 'test@example.com',
    };
  }

  @GrpcMethod('TestService', 'HealthCheck')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}

describe('gRPC Integration Tests', () => {
  let serverApp: INestApplication;
  let clientApp: INestApplication;
  let grpcClient: GrpcClientService;

  const protoPath = join(__dirname, '../fixtures/test.proto');
  const testPort = 50051;

  beforeAll(async () => {
    // Create gRPC server
    const serverModule: TestingModule = await Test.createTestingModule({
      controllers: [TestGrpcController],
    }).compile();

    serverApp = serverModule.createNestApplication();
    
    const grpcServerOptions = createGrpcServerOptions({
      name: 'test-service',
      host: 'localhost',
      port: testPort,
      protoPath,
      package: 'test',
    });

    serverApp.connectMicroservice(grpcServerOptions);
    
    await serverApp.startAllMicroservices();
    await serverApp.init();

    // Create gRPC client
    const clientModule: TestingModule = await Test.createTestingModule({
      imports: [
        GrpcModule.register({
          services: new Map([
            [
              'test-service',
              {
                name: 'test-service',
                host: 'localhost',
                port: testPort,
                protoPath,
                package: 'test',
                timeout: 5000,
                maxRetries: 3,
              },
            ],
          ]),
        }),
      ],
    }).compile();

    clientApp = clientModule.createNestApplication();
    await clientApp.init();

    grpcClient = clientApp.get(GrpcClientService);

    // Wait for server to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await grpcClient.closeAll();
    await serverApp.close();
    await clientApp.close();
  });

  describe('Basic gRPC Communication', () => {
    it('should make a successful gRPC call', async () => {
      const response = await grpcClient.call<{ name: string }, { message: string }>(
        'test-service',
        'TestService',
        'sayHello',
        { name: 'World' },
      );

      expect(response).toBeDefined();
      expect(response.message).toBe('Hello World!');
    });

    it('should retrieve user data via gRPC', async () => {
      const response = await grpcClient.call<
        { id: string },
        { id: string; name: string; email: string }
      >('test-service', 'TestService', 'getUser', { id: 'user-123' });

      expect(response).toBeDefined();
      expect(response.id).toBe('user-123');
      expect(response.name).toBe('Test User');
      expect(response.email).toBe('test@example.com');
    });

    it('should perform health check', async () => {
      const response = await grpcClient.call<
        {},
        { status: string; timestamp: string }
      >('test-service', 'TestService', 'healthCheck', {});

      expect(response).toBeDefined();
      expect(response.status).toBe('healthy');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('Error Handling and Timeouts', () => {
    it('should handle timeout gracefully', async () => {
      await expect(
        grpcClient.call(
          'test-service',
          'TestService',
          'sayHello',
          { name: 'Timeout Test' },
          { timeout: 1 }, // Very short timeout
        ),
      ).rejects.toThrow();
    });

    it('should verify service availability', () => {
      expect(grpcClient.isServiceAvailable('test-service')).toBe(true);
      expect(grpcClient.isServiceAvailable('non-existent-service')).toBe(false);
    });
  });

  describe('Service Discovery', () => {
    it('should get service client', () => {
      const service = grpcClient.getService('test-service', 'TestService');
      expect(service).toBeDefined();
    });

    it('should throw error for non-existent service', () => {
      expect(() => {
        grpcClient.getService('non-existent', 'TestService');
      }).toThrow('gRPC client not found for service: non-existent');
    });
  });
});
