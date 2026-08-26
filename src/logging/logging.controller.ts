import { Controller, Get } from '@nestjs/common';

import { LoggingService } from './logging.service';

@Controller('logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get('health')
  health() {
    return this.loggingService.health();
  }

  @Get('levels')
  levels() {
    return {
      supported: ['error', 'warn', 'info', 'debug', 'verbose'],
      active: process.env.LOG_LEVEL ?? 'info',
    };
  }
}
