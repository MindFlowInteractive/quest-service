import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  getInfo() {
    return {
      name: 'Config Service',
      version: '1.0.0',
      description: 'Centralized configuration management service',
      endpoints: {
        health: '/health',
        configurations: '/configurations',
        environments: '/environments',
        secrets: '/secrets',
        webhooks: '/webhooks',
        'audit-logs': '/audit-logs',
      },
    };
  }
}
