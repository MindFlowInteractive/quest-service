import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { RewardService } from '../services/reward.service';
import { Reward } from '../entities/reward.entity';

interface DistributeTokenDto {
  userId: string;
  amount: number;
  reason?: string;
}

@Controller('rewards')
export class RewardController {
  private readonly logger = new Logger(RewardController.name);

  constructor(private readonly rewardService: RewardService) {}

  @Post('token/distribute')
  async distributeTokenReward(@Body() dto: DistributeTokenDto): Promise<Reward> {
    this.logger.log(`Distributing token reward: ${dto.amount} to user ${dto.userId}`);
    return await this.rewardService.distributeTokenReward(dto.userId, dto.amount, dto.reason);
  }

  @Get('user/:userId')
  async getRewardsByUser(@Param('userId') userId: string): Promise<Reward[]> {
    return await this.rewardService.getRewardsByUser(userId);
  }

  @Get(':id')
  async getRewardById(@Param('id') id: string): Promise<Reward> {
    return await this.rewardService.getRewardById(id);
  }

  @Get('token/balance/:userAddress')
  async getUserTokenBalance(@Param('userAddress') userAddress: string) {
    return await this.rewardService.getUserTokenBalance(userAddress);
  }
}