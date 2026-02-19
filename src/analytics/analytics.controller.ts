import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  async trackEvent(@Body() dto: TrackEventDto) {
    return this.analyticsService.trackEvent(dto);
  }

  @Get('players/overview')
  async getPlayersOverview(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getPlayersOverview(filter);
  }
}
