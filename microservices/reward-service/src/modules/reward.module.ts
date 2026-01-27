import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Reward } from '../entities/reward.entity';
import { RewardService } from '../services/reward.service';
import { RewardController } from '../controllers/reward.controller';
import { StellarService } from '../services/stellar.service';

import { TransactionMonitoringService } from '../services/transaction-monitoring.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Reward]),
    BullModule,
  ],
  controllers: [RewardController],
  providers: [
    RewardService,
    StellarService,
    TransactionMonitoringService,
  ],
  exports: [
    RewardService,
    StellarService,
  ],
})
export class RewardModule {}