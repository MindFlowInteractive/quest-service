import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post('distribute')
  async distribute(@Body() body: { userAddress: string; amount: number }) {
    return this.rewardsService.distributeReward(body.userAddress, body.amount);
  }

  @Get('user/:address')
  async getUserRewards(@Param('address') address: string) {
    return this.rewardsService.getUserRewards(address);
  }
}
