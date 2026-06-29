import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getServiceInfo() {
    return {
      name: 'sms-service',
      version: this.configService.get('SERVICE_VERSION', '1.0.0'),
      description:
        'SMS and text messaging service for verification codes, alerts, and scheduled notifications',
    };
  }

  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
