import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('segment/:segmentId')
  async getBySegment(@Param('segmentId') segmentId: string) {
    return this.analyticsService.getBySegment(segmentId);
  }

  @Get('notification/:notificationId')
  async getByNotification(
    @Param('notificationId') notificationId: string,
  ) {
    return this.analyticsService.getByNotification(notificationId);
  }
}
