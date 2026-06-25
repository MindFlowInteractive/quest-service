import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stock-summary')
  @ApiOperation({ summary: 'Get stock summary analytics' })
  async getStockSummary() {
    return this.analyticsService.getStockSummary();
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Get reservation analytics for a date range' })
  async getReservationAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getReservationAnalytics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('top-selling')
  @ApiOperation({ summary: 'Get top selling items' })
  async getTopSelling(@Query('limit') limit: number = 10) {
    return this.analyticsService.getTopSellingItems(limit);
  }

  @Get('turnover-rate')
  @ApiOperation({ summary: 'Get inventory turnover rate' })
  async getTurnoverRate() {
    return this.analyticsService.getInventoryTurnoverRate();
  }
}