import {
  Controller,
  Get,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { QuestChainLeaderboardService } from '../services/quest-chain-leaderboard.service';

@ApiTags('Quest Chain Leaderboards')
@Controller('quest-chains')
export class QuestChainLeaderboardController {
  constructor(
    private readonly leaderboardService: QuestChainLeaderboardService,
  ) {}

  @Get(':id/leaderboard/speed')
  @ApiOperation({ summary: 'Get speed run leaderboard for a quest chain' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of entries to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Speed run leaderboard retrieved successfully' })
  async getSpeedRunLeaderboard(
    @Param('id') chainId: string,
    @Query('limit', new ValidationPipe({ transform: true })) limit = 10,
  ) {
    return await this.leaderboardService.getSpeedRunLeaderboard(chainId, limit);
  }

  @Get(':id/leaderboard/score')
  @ApiOperation({ summary: 'Get score leaderboard for a quest chain' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of entries to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Score leaderboard retrieved successfully' })
  async getScoreLeaderboard(
    @Param('id') chainId: string,
    @Query('limit', new ValidationPipe({ transform: true })) limit = 10,
  ) {
    return await this.leaderboardService.getScoreLeaderboard(chainId, limit);
  }

  @Get('leaderboard/completions')
  @ApiOperation({ summary: 'Get total completions leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of entries to return (default: 10)' })
  @ApiResponse({ status: 200, description: 'Total completions leaderboard retrieved successfully' })
  async getTotalCompletionsLeaderboard(
    @Query('limit', new ValidationPipe({ transform: true })) limit = 10,
  ) {
    return await this.leaderboardService.getTotalCompletionsLeaderboard(limit);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get completion statistics for a quest chain' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getChainStats(@Param('id') chainId: string) {
    return await this.leaderboardService.getChainCompletionStats(chainId);
  }

  @Get(':id/rank/:userId')
  @ApiOperation({ summary: 'Get user\'s rank in a specific quest chain' })
  @ApiParam({ name: 'id', description: 'Quest chain ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User rank retrieved successfully' })
  async getUserRank(
    @Param('id') chainId: string,
    @Param('userId') userId: string,
  ) {
    return await this.leaderboardService.getUserRankInChain(userId, chainId);
  }
}