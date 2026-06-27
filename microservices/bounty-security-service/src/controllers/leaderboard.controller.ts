import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from '../services/leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('researchers')
  @ApiOperation({ summary: 'Top researchers by reputation' })
  @ApiQuery({ name: 'period', required: false, enum: ['all', 'month', 'week'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async topResearchers(
    @Query('period') period?: 'all' | 'month' | 'week',
    @Query('limit') limit = 25,
  ) {
    return this.leaderboardService.topResearchers({
      period,
      limit: Number(limit),
    });
  }

  @Get('bounties/:id/researchers')
  @ApiOperation({ summary: 'Top researchers who earned rewards from a specific bounty' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async topPerBounty(
    @Param('id') id: string,
    @Query('limit') limit = 10,
  ) {
    return this.leaderboardService.topResearchersPerBounty(id, Number(limit));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Global leaderboard stats' })
  async stats() {
    return this.leaderboardService.globalStats();
  }
}
