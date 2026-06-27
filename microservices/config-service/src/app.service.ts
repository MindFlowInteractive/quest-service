import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'OK',
      service: 'config-service',
      timestamp: new Date().toISOString(),
    };
  }
}
