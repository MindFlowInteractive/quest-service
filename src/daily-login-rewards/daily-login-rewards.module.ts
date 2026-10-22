import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LoginRewardCalendar } from './entities/login-reward-calendar.entity';
import { PlayerLoginRewardClaim } from './entities/player-login-reward-claim.entity';
import { PlayerLoginStreak } from './entities/player-login-streak.entity';
import { DailyLoginRewardsController } from './daily-login-rewards.controller';
import { DailyLoginRewardsService } from './daily-login-rewards.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoginRewardCalendar,
      PlayerLoginRewardClaim,
      PlayerLoginStreak,
    ]),
    AuthModule,
  ],
  controllers: [DailyLoginRewardsController],
  providers: [DailyLoginRewardsService],
  exports: [DailyLoginRewardsService],
})
export class DailyLoginRewardsModule {}
