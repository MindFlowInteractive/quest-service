import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { AchievementService } from '../services/achievement.service';
import { RewardModule } from './reward.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Achievement, UserAchievement]),
    RewardModule,
  ],
  providers: [AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}