import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { MentorReward } from './entities/reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MentorReward])],
  controllers: [],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
