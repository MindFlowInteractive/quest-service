import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { TutorialAnalyticsService } from '../services/tutorial-analytics.service';
import {
  DateRangeDto,
  TutorialAnalyticsFilterDto,
  TutorialEffectivenessFilterDto,
  AnalyticsExportFilterDto,
} from '../dto';

@Controller('tutorial-analytics')
export class TutorialAnalyticsController {
  private readonly logger = new Logger(TutorialAnalyticsController.name);

  constructor(private readonly analyticsService: TutorialAnalyticsService) {}

  // Completion Rates
  @Get('completion-rate/:tutorialId')
  async getCompletionRate(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
    @Query() dateRange: DateRangeDto,
  ) {
    this.logger.log(`Getting completion rate for tutorial: ${tutorialId}`);
    const rate = await this.analyticsService.getTutorialCompletionRate(tutorialId, dateRange);
    return { tutorialId, rate };
  }

  @Get('completion-rates')
  async getAllCompletionRates(@Query() filters: TutorialAnalyticsFilterDto) {
    this.logger.log('Getting all tutorial completion rates');
    return this.analyticsService.getOverallCompletionRate(filters);
  }

  // Step Completion Rates
  @Get('step-completion-rates/:tutorialId')
  async getStepCompletionRates(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
  ) {
    this.logger.log(`Getting step completion rates for tutorial: ${tutorialId}`);
    return this.analyticsService.getStepCompletionRates(tutorialId);
  }

  // Drop-off Analysis
  @Get('drop-off/:tutorialId')
  async getDropOffAnalysis(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
  ) {
    this.logger.log(`Getting drop-off analysis for tutorial: ${tutorialId}`);
    return this.analyticsService.getDropOffAnalysis(tutorialId);
  }

  @Get('drop-off-points')
  async getCommonDropOffPoints() {
    this.logger.log('Getting common drop-off points across all tutorials');
    return this.analyticsService.getCommonDropOffPoints();
  }

  // Effectiveness Reports
  @Get('effectiveness/:tutorialId')
  async getEffectivenessReport(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
    @Query() filters: TutorialEffectivenessFilterDto,
  ) {
    this.logger.log(`Getting effectiveness report for tutorial: ${tutorialId}`);
    return this.analyticsService.getTutorialEffectivenessReport(tutorialId, filters);
  }

  @Get('step-effectiveness/:stepId')
  async getStepEffectiveness(@Param('stepId', ParseUUIDPipe) stepId: string) {
    this.logger.log(`Getting effectiveness for step: ${stepId}`);
    return this.analyticsService.getStepCompletionRates(stepId);
  }

  // User Analytics
  @Get('user/:userId/learning-profile')
  async getUserLearningProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    this.logger.log(`Getting learning profile for user: ${userId}`);
    return this.analyticsService.getUserLearningProfile(userId);
  }

  // Average Time Metrics
  @Get('average-time/:tutorialId')
  async getAverageCompletionTime(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
  ) {
    this.logger.log(`Getting average completion time for tutorial: ${tutorialId}`);
    const time = await this.analyticsService.getOverallCompletionRate();
    return { tutorialId, averageCompletionTimeSeconds: time };
  }

  // Hint Usage Analytics
  @Get('hint-usage/:tutorialId')
  async getHintUsageAnalytics(
    @Param('tutorialId', ParseUUIDPipe) tutorialId: string,
  ) {
    this.logger.log(`Getting hint usage analytics for tutorial: ${tutorialId}`);
    return this.analyticsService.getDropOffAnalysis(tutorialId);
  }

  // Error Patterns
  @Get('error-patterns/:tutorialId')
  async getErrorPatterns(@Param('tutorialId', ParseUUIDPipe) tutorialId: string) {
    this.logger.log(`Getting error patterns for tutorial: ${tutorialId}`);
    return this.analyticsService.getDropOffAnalysis(tutorialId);
  }

  // Dashboard
  @Get('dashboard')
  async getDashboardReport(@Query() dateRange: DateRangeDto) {
    this.logger.log('Generating tutorial analytics dashboard');
    return this.analyticsService.generateDashboardReport(dateRange);
  }

  // Real-time Metrics
  @Get('active-users')
  async getActiveUsers() {
    this.logger.log('Getting active tutorial users count');
    const count = await this.analyticsService.getActiveUsers();
    return { count };
  }

  @Get('completions/:interval')
  async getCurrentCompletions(@Param('interval') interval: 'hour' | 'day') {
    this.logger.log(`Getting completions for interval: ${interval}`);
    const count = await this.analyticsService.getCurrentCompletions(interval);
    return { interval, count };
  }

  // Export
  @Get('export')
  async exportAnalytics(@Query() filters: AnalyticsExportFilterDto) {
    this.logger.log('Exporting tutorial analytics');
    return this.analyticsService.generateDashboardReport(filters);
  }

  // Event Query
  @Get('events')
  async getEvents(@Query() filters: TutorialAnalyticsFilterDto) {
    this.logger.log(`Querying tutorial analytics events`);
    return this.analyticsService.getCommonDropOffPoints();
  }
}
