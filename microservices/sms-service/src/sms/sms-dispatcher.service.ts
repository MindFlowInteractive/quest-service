import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

@Injectable()
export class SmsDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsDispatcherService.name);
  private intervalHandle?: NodeJS.Timeout;

  constructor(
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMs = this.configService.get<number>('sms.dispatch.intervalMs', 5000);
    this.intervalHandle = setInterval(async () => {
      const processed = await this.smsService.processDueMessages();
      if (processed > 0) {
        this.logger.log(`Processed ${processed} queued SMS messages`);
      }
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }
}
