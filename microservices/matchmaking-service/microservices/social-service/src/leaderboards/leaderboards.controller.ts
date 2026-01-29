import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';
import { CreateLeaderboardEntryDto, UpdateLeaderboardScoreDto } from './dto';

@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  /**
   * Create leaderboard entry
   * POST /leaderboards
   */
  @Post()
  async createEntry(@Body() dto: CreateLeaderboardEntryDto) {
    return this.leaderboardsService.createOrGetEntry(dto);
  }

  /**
   * Get top players
   * GET /leaderboards/top?limit=100&seasonId=current
   */
  @Get('top')
  async getTopPlayers(
    @Query('limit') limit: string = '100',
    @Query('seasonId') seasonId: string = 'current',
  ) {
    return this.leaderboardsService.getTopPlayers(seasonId, parseInt(limit, 10));
  }

  /**
   * Get leaderboard with pagination
   * GET /leaderboards/season/:seasonId?page=1&pageSize=50
   */
  @Get('season/:seasonId')
  async getLeaderboard(
    @Param('seasonId') seasonId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    return this.leaderboardsService.getLeaderboard(
      seasonId,
      parseInt(page, 10),
      parseInt(pageSize, 10),
    );
  }

  /**
   * Get season statistics
   * GET /leaderboards/season/:seasonId/stats
   */
  @Get('season/:seasonId/stats')
  async getSeasonStats(@Param('seasonId') seasonId: string) {
    return this.leaderboardsService.getSeasonStats(seasonId);
  }

  /**
   * Get player entry
   * GET /leaderboards/user/:userId
   */
  @Get('user/:userId')
  async getUserEntry(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId: string = 'current',
  ) {
    return this.leaderboardsService.getUserEntry(userId, seasonId);
  }

  /**
   * Get player rank with context
   * GET /leaderboards/user/:userId/rank
   */
  @Get('user/:userId/rank')
  async getPlayerRankContext(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId: string = 'current',
    @Query('contextSize') contextSize: string = '5',
  ) {
    return this.leaderboardsService.getPlayerRankContext(
      userId,
      seasonId,
      parseInt(contextSize, 10),
    );
  }

  /**
   * Get win rate
   * GET /leaderboards/user/:userId/win-rate
   */
  @Get('user/:userId/win-rate')
  async getWinRate(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId: string = 'current',
  ) {
    const winRate = await this.leaderboardsService.getWinRate(userId, seasonId);
    return { userId, seasonId, winRate: `${winRate.toFixed(2)}%` };
  }

  /**
   * Update score
   * PATCH /leaderboards/user/:userId/score
   */
  @Patch('user/:userId/score')
  async updateScore(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId: string = 'current',
    @Body() dto: UpdateLeaderboardScoreDto,
  ) {
    return this.leaderboardsService.updateScore(userId, seasonId, dto);
  }

  /**
   * Add score points
   * POST /leaderboards/user/:userId/add-score
   */
  @Post('user/:userId/add-score')
  async addScore(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId: string = 'current',
    @Query('points') points: string = '0',
  ) {
    return this.leaderboardsService.addScore(
      userId,
      seasonId,
      parseInt(points, 10),
    );
  }

  /**
   * Record a win
   * POST /leaderboards/user/:userId/win
   */
  @Post('user/:userId/win')
  async recordWin(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId: string = 'current',
    @Query('points') points: string = '10',
  ) {
    return this.leaderboardsService.recordWin(
      userId,
      seasonId,
      parseInt(points, 10),
    );
  }

  /**
   * Record a loss
   * POST /leaderboards/user/:userId/loss
   */
  @Post('user/:userId/loss')
  async recordLoss(
    @Param('userId') userId: string,
    @Query('seasonId') seasonId: string = 'current',
    @Query('points') points: string = '5',
  ) {
    return this.leaderboardsService.recordLoss(
      userId,
      seasonId,
      parseInt(points, 10),
    );
  }
}
