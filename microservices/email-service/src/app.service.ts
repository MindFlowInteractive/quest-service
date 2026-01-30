import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getServiceInfo() {
    return {
      name: 'email-service',
      version: this.configService.get('SERVICE_VERSION', '1.0.0'),
      description: 'Email and Communication Service for transactional emails, newsletters, and player communications',
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
