import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Reward } from './entities/reward.entity';
import { RewardQueue } from './entities/reward-queue.entity';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { RewardCalculationService } from './reward-calculation.service';
import { SorobanTokenService } from './soroban-token.service';
import { RewardQueueService } from './reward-queue.service';
import { BatchRewardDistributionService } from './batch-reward-distribution.service';
import { TransactionSubmissionService } from './transaction-submission.service';
import { PuzzleRewardListenerService } from './puzzle-reward-listener.service';
import { Puzzle } from '../../../src/puzzles/entities/puzzle.entity';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Reward, RewardQueue, Puzzle]),
  ],
  controllers: [RewardsController],
  providers: [
    RewardsService,
    RewardCalculationService,
    SorobanTokenService,
    RewardQueueService,
    BatchRewardDistributionService,
    TransactionSubmissionService,
    PuzzleRewardListenerService,
  ],
  exports: [
    RewardsService,
    RewardCalculationService,
    SorobanTokenService,
    RewardQueueService,
    BatchRewardDistributionService,
    PuzzleRewardListenerService,
  ],
})
export class RewardsModule {}