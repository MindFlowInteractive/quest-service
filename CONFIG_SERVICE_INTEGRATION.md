# Config Service - Integration Guide for Other Microservices

This guide explains how to integrate the Config Service with your microservices.

## Overview

The Config Service provides three main integration points:

1. **Direct API calls** - Fetch configs on demand
2. **Startup initialization** - Load configs when service starts
3. **Webhook subscriptions** - Get real-time config updates

## 1. Direct API Integration

### Setup

Add the Config Service URL to your `.env`:

```env
CONFIG_SERVICE_URL=http://config-service:3020
```

### Fetch Configuration on Demand

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AppConfigService {
  constructor(private http: HttpService) {}

  async getConfig(key: string): Promise<any> {
    try {
      const response = await this.http
        .get(`${process.env.CONFIG_SERVICE_URL}/configurations/key/${key}`)
        .toPromise();
      return response.data.value;
    } catch (error) {
      console.error(`Failed to fetch config ${key}:`, error);
      return null;
    }
  }

  async getAllConfigs(): Promise<Record<string, any>> {
    try {
      const response = await this.http
        .get(`${process.env.CONFIG_SERVICE_URL}/configurations`)
        .toPromise();
      
      const configs: Record<string, any> = {};
      response.data.forEach((config: any) => {
        configs[config.key] = config.value;
      });
      return configs;
    } catch (error) {
      console.error('Failed to fetch all configs:', error);
      return {};
    }
  }
}
```

### Fetch Secret

```typescript
async getSecret(name: string): Promise<string> {
  try {
    const response = await this.http
      .get(`${process.env.CONFIG_SERVICE_URL}/secrets/name/${name}/value`)
      .toPromise();
    return response.data.value;
  } catch (error) {
    console.error(`Failed to fetch secret ${name}:`, error);
    return null;
  }
}
```

## 2. Startup Initialization

### Load All Configs on App Start

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ConfigInitializerService implements OnModuleInit {
  private configs: Record<string, any> = {};
  private secrets: Record<string, string> = {};

  constructor(
    private http: HttpService,
    private configService: NestConfigService,
  ) {}

  async onModuleInit() {
    console.log('Initializing configurations from Config Service...');
    
    try {
      // Load all configurations
      const configResponse = await this.http
        .get(`${process.env.CONFIG_SERVICE_URL}/configurations`)
        .toPromise();

      configResponse.data.forEach((config: any) => {
        this.configs[config.key] = this.parseConfigValue(config);
      });

      console.log(`✓ Loaded ${Object.keys(this.configs).length} configurations`);

      // Subscribe to updates
      await this.subscribeToUpdates();
    } catch (error) {
      console.error('Failed to initialize configurations:', error);
      console.log('Using fallback configuration...');
    }
  }

  private parseConfigValue(config: any): any {
    switch (config.type) {
      case 'number':
        return Number(config.value);
      case 'boolean':
        return config.value === 'true' || config.value === true;
      case 'json':
        return JSON.parse(config.value);
      case 'string':
      default:
        return config.value;
    }
  }

  private async subscribeToUpdates(): Promise<void> {
    const serviceName = this.configService.get('SERVICE_NAME');
    const webhookUrl = this.configService.get('WEBHOOK_URL');

    if (!serviceName || !webhookUrl) {
      console.warn('SERVICE_NAME or WEBHOOK_URL not set, skipping webhook subscription');
      return;
    }

    try {
      await this.http
        .post(`${process.env.CONFIG_SERVICE_URL}/webhooks`, {
          serviceName,
          webhookUrl,
          events: ['CONFIG_CREATED', 'CONFIG_UPDATED', 'CONFIG_DELETED'],
        })
        .toPromise();

      console.log(`✓ Subscribed to config updates at ${webhookUrl}`);
    } catch (error) {
      console.error('Failed to subscribe to webhooks:', error);
    }
  }

  get(key: string, defaultValue?: any): any {
    return this.configs[key] ?? defaultValue;
  }

  getAll(): Record<string, any> {
    return { ...this.configs };
  }
}
```

### Use in Your Service

```typescript
@Injectable()
export class PaymentService {
  constructor(private configInitializer: ConfigInitializerService) {}

  processPayment(amount: number) {
    const minAmount = this.configInitializer.get('MIN_PAYMENT_AMOUNT', 1);
    const maxAmount = this.configInitializer.get('MAX_PAYMENT_AMOUNT', 10000);

    if (amount < minAmount || amount > maxAmount) {
      throw new Error(`Amount must be between ${minAmount} and ${maxAmount}`);
    }

    // Process payment...
  }
}
```

## 3. Real-time Updates via Webhooks

### Setup Webhook Handler

```typescript
import { Controller, Post, Body, Req } from '@nestjs/common';
import * as crypto from 'crypto';

@Controller('webhooks')
export class ConfigWebhookController {
  private webhookSecret = process.env.CONFIG_WEBHOOK_SECRET;

  @Post('config-update')
  async handleConfigUpdate(
    @Body() payload: any,
    @Req() req: any,
  ) {
    // Verify webhook signature
    const signature = req.headers['x-webhook-signature'];
    if (!this.verifySignature(payload, signature)) {
      return { status: 'unauthorized' };
    }

    const { event, data } = payload;

    console.log(`Received config update: ${event}`, data);

    switch (event) {
      case 'CONFIG_CREATED':
        await this.handleConfigCreated(data);
        break;
      case 'CONFIG_UPDATED':
        await this.handleConfigUpdated(data);
        break;
      case 'CONFIG_DELETED':
        await this.handleConfigDeleted(data);
        break;
    }

    return { status: 'ok' };
  }

  private verifySignature(payload: any, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  private async handleConfigCreated(data: any) {
    console.log('Config created:', data);
    // Update your local cache or reload configs
  }

  private async handleConfigUpdated(data: any) {
    console.log('Config updated:', data);
    // Update your local cache
  }

  private async handleConfigDeleted(data: any) {
    console.log('Config deleted:', data);
    // Remove from your local cache
  }
}
```

### Register Webhook Endpoint

```typescript
// In your app.module.ts or main.ts
const app = await NestFactory.create(AppModule);

// Make sure your webhook endpoint is accessible from Config Service
const webhookUrl = `http://${process.env.SERVICE_HOST}:${process.env.SERVICE_PORT}/webhooks/config-update`;
console.log(`Webhook endpoint: ${webhookUrl}`);

await app.listen(process.env.SERVICE_PORT);
```

### Add to Environment

```env
# Your service configuration
SERVICE_NAME=payment-service
SERVICE_HOST=payment-service
SERVICE_PORT=3019
WEBHOOK_URL=http://payment-service:3019/webhooks/config-update

# Config Service connection
CONFIG_SERVICE_URL=http://config-service:3020
CONFIG_WEBHOOK_SECRET=my-webhook-secret
```

## 4. Using Secrets

### Get Secret at Runtime

```typescript
@Injectable()
export class DatabaseService {
  constructor(private http: HttpService) {}

  async getConnection() {
    const password = await this.getSecret('DB_PASSWORD');
    
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password,
      database: process.env.DB_NAME,
    };
  }

  private async getSecret(name: string): Promise<string> {
    try {
      const response = await this.http
        .get(`${process.env.CONFIG_SERVICE_URL}/secrets/name/${name}/value`)
        .toPromise();
      return response.data.value;
    } catch (error) {
      console.error(`Failed to fetch secret: ${name}`, error);
      throw error;
    }
  }
}
```

## 5. Integration Module Template

Create a reusable module for easy integration:

```typescript
// config-integration.module.ts
import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigInitializerService } from './config-initializer.service';
import { ConfigWebhookController } from './config-webhook.controller';

@Global()
@Module({
  imports: [HttpModule],
  providers: [ConfigInitializerService],
  controllers: [ConfigWebhookController],
  exports: [ConfigInitializerService],
})
export class ConfigIntegrationModule {}
```

Add to your service's `app.module.ts`:

```typescript
@Module({
  imports: [ConfigIntegrationModule, /* other modules */],
})
export class AppModule {}
```

## 6. Environment-Specific Configs

### Load Environment-Specific Configuration

```typescript
async onModuleInit() {
  const environment = process.env.NODE_ENV || 'development';
  
  try {
    // Get environment object
    const envResponse = await this.http
      .get(`${process.env.CONFIG_SERVICE_URL}/environments/name/${environment}`)
      .toPromise();

    const environmentId = envResponse.data.id;

    // Get configs for this environment
    const configResponse = await this.http
      .get(`${process.env.CONFIG_SERVICE_URL}/configurations/environment/${environmentId}`)
      .toPromise();

    console.log(`✓ Loaded ${configResponse.data.length} configs for ${environment}`);
  } catch (error) {
    console.error(`Failed to load environment configs:`, error);
  }
}
```

## 7. Error Handling & Fallbacks

```typescript
@Injectable()
export class SafeConfigService {
  private fallbackConfigs = {
    LOG_LEVEL: 'info',
    REQUEST_TIMEOUT: 30000,
    RATE_LIMIT: 100,
  };

  constructor(private configInitializer: ConfigInitializerService) {}

  getConfig(key: string): any {
    try {
      const value = this.configInitializer.get(key);
      if (value === undefined) {
        return this.fallbackConfigs[key];
      }
      return value;
    } catch (error) {
      console.error(`Error getting config ${key}:`, error);
      return this.fallbackConfigs[key];
    }
  }
}
```

## 8. Testing Configuration

### Mock Config Service for Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const configs = {
        'MIN_PAYMENT_AMOUNT': 1,
        'MAX_PAYMENT_AMOUNT': 10000,
      };
      return configs[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: ConfigInitializerService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should respect config limits', () => {
    expect(() => service.processPayment(0.5)).toThrow();
    expect(() => service.processPayment(50000)).toThrow();
  });
});
```

## Best Practices

1. **Error Handling**: Always provide fallback values
2. **Caching**: Cache configs locally to reduce API calls
3. **Async Loading**: Load configs asynchronously on startup
4. **Validation**: Validate config values on load
5. **Logging**: Log all config changes and updates
6. **Secrets**: Never log or expose secret values
7. **Monitoring**: Track config changes in audit logs
8. **Testing**: Use mock services in unit tests

## Troubleshooting

### Config Service Not Accessible
```
Error: Cannot connect to config-service:3020
Solution: Check CONFIG_SERVICE_URL in .env and ensure service is running
```

### Webhook Signature Verification Failed
```
Solution: Ensure CONFIG_WEBHOOK_SECRET matches the secret in Config Service webhook subscription
```

### Configs Not Loading
```
Solution: Check logs, verify network connectivity, check database connection
```

## Additional Resources

- Config Service README: `/microservices/config-service/README.md`
- API Documentation: `http://config-service:3020/api`
- Source Code: `/microservices/config-service/src`
