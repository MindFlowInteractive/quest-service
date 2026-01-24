import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(@Inject(ConfigService) private configService: any) { }

  getHello(): { message: string; timestamp: string } {
    return {
      message: 'Welcome to LogiQuest Backend API! 🧩',
      timestamp: new Date().toISOString(),
    };
  }

  getAppInfo() {
    return {
      name: 'LogiQuest Backend',
      version: this.configService.get('npm_package_version', '1.0.0'),
      environment: this.configService.get('NODE_ENV', 'development'),
      apiPrefix: this.configService.get('API_PREFIX', 'api/v1'),
      description: 'A puzzle-solving game backend built with NestJS',
    };
  }
}
