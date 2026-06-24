import { Controller, Get } from '@nestjs/common';
import { FcmProvider } from './providers/fcm.provider';

@Controller()
export class AppController {
  constructor(private readonly fcmProvider: FcmProvider) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'push-notification-service',
      fcmReady: this.fcmProvider.isReady(),
      timestamp: new Date().toISOString(),
    };
  }
}
