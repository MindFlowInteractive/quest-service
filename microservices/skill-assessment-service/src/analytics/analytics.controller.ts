import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('player/:playerId/trajectory')
  @ApiOperation({ summary: 'Get player skill trajectory over time' })
  @ApiResponse({ status: 200, description: 'Skill trajectory retrieved successfully' })
  getPlayerSkillTrajectory(@Param('playerId') playerId: string) {
    return this.analyticsService.getPlayerSkillTrajectory(playerId);
  }

  @Get('assessment')
  @ApiOperation({ summary: 'Get overall assessment analytics' })
  @ApiResponse({ status: 200, description: 'Assessment analytics retrieved successfully' })
  getAssessmentAnalytics() {
    return this.analyticsService.getAssessmentAnalytics();
  }

  @Get('player/:playerId')
  @ApiOperation({ summary: 'Get player-specific analytics' })
  @ApiResponse({ status: 200, description: 'Player analytics retrieved successfully' })
  getPlayerAnalytics(@Param('playerId') playerId: string) {
    return this.analyticsService.getPlayerAnalytics(playerId);
  }

  @Get('player/:playerId/skill-gaps')
  @ApiOperation({ summary: 'Get skill gap analysis for a player' })
  @ApiResponse({ status: 200, description: 'Skill gap analysis retrieved successfully' })
  getSkillGapAnalysis(@Param('playerId') playerId: string) {
    return this.analyticsService.getSkillGapAnalysis(playerId);
  }
}
