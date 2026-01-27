import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post("click")
  async trackClick(@Body() body: { searchId: string; resultId: string }) {
    await this.analyticsService.trackClick(body.searchId, body.resultId);
    return { success: true };
  }

  @Get("popular-queries")
  async getPopularQueries(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("index") index?: string,
  ) {
    const query = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      index,
    };

    return this.analyticsService.getPopularQueries(query);
  }

  @Get("metrics")
  async getSearchMetrics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("index") index?: string,
  ) {
    const query = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      index,
    };

    return this.analyticsService.getSearchMetrics(query);
  }

  @Get("failed-searches")
  async getFailedSearches(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("index") index?: string,
  ) {
    const query = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      index,
    };

    return this.analyticsService.getFailedSearches(query);
  }
}
