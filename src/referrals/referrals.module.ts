import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { ReferralLeaderboardService } from './referral-leaderboard.service';
import { ReferralAnalyticsService } from './referral-analytics.service';
import { ReferralCode } from './entities/referral-code.entity';
import { Referral } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReferralCode, Referral, User]),
    ConfigModule,
  ],
  controllers: [ReferralsController],
  providers: [
    ReferralsService,
    ReferralLeaderboardService,
    ReferralAnalyticsService,
  ],
  exports: [ReferralsService, ReferralLeaderboardService, ReferralAnalyticsService],
})
export class ReferralsModule {}
