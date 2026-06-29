import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Skill Assessment Service is running';
  }

  healthCheck(): object {
    return {
      status: 'ok',
      service: 'skill-assessment-service',
      timestamp: new Date().toISOString(),
    };
  }
}
