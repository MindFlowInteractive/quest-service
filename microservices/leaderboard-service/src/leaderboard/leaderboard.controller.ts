import { Controller, Get, Post, Query, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { GetLeaderboardQueryDto, UpdateScoreDto, GetPlayerRankDto } from './dto/leaderboard.dto';
import { LeaderboardCategory, TimePeriod } from './entities/leaderboard.entity';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Query() query: GetLeaderboardQueryDto) {
    const { category, timePeriod, page, limit } = query;
    return this.leaderboardService.getLeaderboard(
      category || LeaderboardCategory.SCORE,
      timePeriod || TimePeriod.ALL_TIME,
      page,
      limit,
    );
  }

  @Get('player/:playerId')
  async getPlayerRank(
    @Param('playerId', ParseUUIDPipe) playerId: string,
    @Query() query: GetPlayerRankDto,
  ) {
    return this.leaderboardService.getPlayerRank(
      playerId,
      query.category,
      query.timePeriod || TimePeriod.ALL_TIME,
    );
  }

  @Post('score')
  async updateScore(@Body() dto: UpdateScoreDto) {
    return this.leaderboardService.updateScore(dto);
  }

  @Post('reset/:period')
  async resetLeaderboard(@Param('period') period: TimePeriod) {
    await this.leaderboardService.resetLeaderboard(period);
    return { message: `Leaderboard reset for ${period}` };
  }
}