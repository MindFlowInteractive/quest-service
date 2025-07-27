import { Controller, Get } from "@nestjs/common"
import type { AnalyticsService } from "../services/analytics.service"

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("player/:playerId")
  async getPlayerAnalytics(playerId: string) {
    return this.analyticsService.getPlayerAnalytics(playerId)
  }

  @Get("puzzle/:puzzleId")
  async getPuzzleAnalytics(puzzleId: string) {
    return this.analyticsService.getPuzzleAnalytics(puzzleId)
  }

  @Get("system")
  async getSystemAnalytics() {
    return this.analyticsService.getSystemAnalytics()
  }
}
