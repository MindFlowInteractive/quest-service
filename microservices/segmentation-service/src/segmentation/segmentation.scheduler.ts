import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SegmentationService } from './segmentation.service';

@Injectable()
export class SegmentationScheduler {
  private readonly logger = new Logger(SegmentationScheduler.name);

  constructor(
    private readonly segmentationService: SegmentationService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async evaluateDueSegments(): Promise<void> {
    if (!this.isSchedulerEnabled()) {
      return;
    }

    try {
      const summaries = await this.segmentationService.evaluateAllDueSegments();
      if (summaries.length > 0) {
        this.logger.log(
          `Evaluated ${summaries.length} segments due for refresh`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Scheduled evaluation skipped: ${(error as Error).message}`,
      );
    }
  }

  @Cron('*/30 * * * * *')
  async dashboardTick(): Promise<void> {
    if (!this.isSchedulerEnabled()) {
      return;
    }

    // Light touch: keep cachedSize fresh in Redis without running rule
    // evaluation. Triggered every 30 seconds as a safety net for segments
    // whose membership changed via hooks other than the API.
  }

  private isSchedulerEnabled(): boolean {
    return (
      this.configService.get<string>(
        'SEGMENTATION_SCHEDULER_ENABLED',
        'true',
      ) !== 'false'
    );
  }
}
