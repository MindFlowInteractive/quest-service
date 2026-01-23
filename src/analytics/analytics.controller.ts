// src/analytics/analytics.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

import {
  FilterPlayerBehaviorDto,
  FilterPuzzlePerformanceDto,
  FilterEngagementDto,
  FilterRevenueDto,
  FilterABTestDto,
  FilterCustomEventDto,
  TrackEventDto,
  TrackPuzzleAttemptDto,
  TrackABTestResultDto,
} from './dto';

// Optional auth (enable when ready)
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
// @UseGuards(RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * EVENT TRACKING
   */
  @Post('events/track')
  @HttpCode(HttpStatus.CREATED)
  async trackEvent(@Body() dto: TrackEventDto) {
    return this.analyticsService.trackEvent(dto);
  }

  @Post('puzzles/track-attempt')
  @HttpCode(HttpStatus.CREATED)
  async trackPuzzleAttempt(@Body() dto: TrackPuzzleAttemptDto) {
    return this.analyticsService.trackPuzzleAttempt(dto);
  }

  @Post('abtest/track-result')
  @HttpCode(HttpStatus.CREATED)
  async trackABTestResult(@Body() dto: TrackABTestResultDto) {
    return this.analyticsService.trackABTestResult(dto);
  }

  /**
   * PLAYER BEHAVIOR
   */
  @Get('player-behavior')
  // @Roles('admin', 'analyst')
  async getPlayerBehavior(@Query() filters: FilterPlayerBehaviorDto) {
    return this.analyticsService.getPlayerBehaviorAnalytics(filters);
  }

  /**
   * PUZZLE PERFORMANCE
   */
  @Get('puzzle-performance')
  // @Roles('admin', 'analyst', 'designer')
  async getPuzzlePerformance(@Query() filters: FilterPuzzlePerformanceDto) {
    return this.analyticsService.getPuzzlePerformanceAnalytics(filters);
  }

  /**
   * ENGAGEMENT & RETENTION
   */
  @Get('engagement')
  // @Roles('admin', 'analyst')
  async getEngagement(@Query() filters: FilterEngagementDto) {
    return this.analyticsService.getEngagementAnalytics(filters);
  }

  @Get('retention/:cohortDate')
  // @Roles('admin', 'analyst')
  async getRetention(@Param('cohortDate') cohortDate: string) {
    return this.analyticsService.getRetentionAnalysis(cohortDate);
  }

  /**
   * REVENUE
   */
  @Get('revenue')
  // @Roles('admin', 'analyst', 'finance')
  async getRevenue(@Query() filters: FilterRevenueDto) {
    return this.analyticsService.getRevenueAnalytics(filters);
  }

  /**
   * A/B TESTING
   */
  @Get('abtest/results')
  // @Roles('admin', 'analyst', 'designer')
  async getABTestResults(@Query() filters: FilterABTestDto) {
    return this.analyticsService.getABTestResults(filters);
  }

  /**
   * FUNNEL ANALYTICS
   */
  @Get('funnel')
  // @Roles('admin', 'analyst', 'product')
  async getFunnelAnalytics(@Query() filters: FilterCustomEventDto) {
    return this.analyticsService.getFunnelAnalytics(filters);
  }

  /**
   * PREDICTIVE ANALYTICS
   */
  @Get('churn-prediction/:playerId')
  // @Roles('admin', 'analyst')
  async predictChurn(@Param('playerId') playerId: string) {
    return this.analyticsService.predictPlayerChurn(playerId);
  }

  /**
   * REAL-TIME DASHBOARD
   */
  @Get('dashboard/realtime')
  // @Roles('admin', 'analyst')
  async getRealTimeDashboard() {
    return this.analyticsService.getRealTimeDashboard();
  }

  /**
   * REPORTING
   */
  @Get('reports/daily/:date')
  // @Roles('admin', 'analyst')
  async getDailyReport(@Param('date') date: string) {
    return this.analyticsService.generateDailyReport(date);
  }

  /**
   * DATA EXPORT
   */
  @Post('exports')
  // @Roles('admin', 'analyst')
  @HttpCode(HttpStatus.ACCEPTED)
  async exportAnalytics(@Body('type') type: string) {
    return this.analyticsService.exportAnalyticsData(type);
  }

  /**
   * HEALTH CHECK
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'analytics',
      timestamp: new Date().toISOString(),
    };
  }
}
