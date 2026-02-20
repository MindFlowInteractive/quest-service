import { Controller, Get, Post, Patch, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { Reward } from './entities/reward.entity';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('user/:userId')
  async getUserRewards(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('type') type?: 'token' | 'nft' | 'achievement' | 'bonus',
    @Query('status') status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Reward[]> {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    
    return this.rewardsService.getUserRewards(userId, {
      type,
      status,
      limit: limitNum,
      offset: offsetNum,
    });
  }

  @Post('claim/:rewardId')
  @HttpCode(HttpStatus.OK)
  async claimReward(
    @Param('rewardId', ParseUUIDPipe) rewardId: string,
    @Body('walletAddress') walletAddress?: string,
  ): Promise<{ success: boolean, message: string, transactionHash?: string }> {
    return this.rewardsService.claimReward(rewardId, walletAddress);
  }

  @Post('puzzle-completed')
  @HttpCode(HttpStatus.CREATED)
  async handlePuzzleCompletion(
    @Body('userId') userId: string,
    @Body('puzzleId') puzzleId: string,
    @Body('completionTime') completionTime?: number,
    @Body('hintsUsed') hintsUsed?: number,
  ): Promise<{ success: boolean, rewardAmount?: number, message: string }> {
    return this.rewardsService.handlePuzzleCompletion(userId, puzzleId, completionTime, hintsUsed);
  }

  @Get('queue/:userId')
  async getUserQueuedRewards(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<any[]> {
    return this.rewardsService.getUserQueuedRewards(userId);
  }

  @Get('history/:userId')
  async getUserRewardHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit: string = '50',
  ): Promise<any[]> {
    return this.rewardsService.getUserRewardHistory(userId, parseInt(limit, 10));
  }

  @Get('balance/:userId')
  async getUserTokenBalance(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ balance: number, available: number, pending: number }> {
    return this.rewardsService.getUserTokenBalance(userId);
  }
}