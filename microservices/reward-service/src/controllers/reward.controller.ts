import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RewardService } from '../services/reward.service';
import { Reward } from '../entities/reward.entity';

class DistributeRewardDto {
  userId: string;
  amount: number;
  reason?: string;
}

@Controller('rewards')
export class RewardController {
  private readonly logger = new Logger(RewardController.name);

  constructor(private readonly rewardService: RewardService) {}

  // ─── Token Distribution ───────────────────────────────────────────────────────
  @Post('distribute')
  @HttpCode(HttpStatus.CREATED)
  async distribute(@Body() dto: DistributeRewardDto): Promise<Reward> {
    this.logger.log(
      `Distributing ${dto.amount} tokens to user ${dto.userId}`,
    );
    return this.rewardService.distributeTokenReward(
      dto.userId,
      dto.amount,
      dto.reason,
    );
  }

  // ─── Queries ──────────────────────────────────────────────────────────────────
  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string): Promise<Reward[]> {
    return this.rewardService.getRewardsByUser(userId);
  }

  @Get('balance/:userAddress')
  async getBalance(@Param('userAddress') userAddress: string) {
    return this.rewardService.getUserTokenBalance(userAddress);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Reward> {
    return this.rewardService.getRewardById(id);
  }
}
