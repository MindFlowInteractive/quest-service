import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PrivacySettings } from '../privacy/entities/privacy-settings.entity';
import { UserStreak } from '../users/entities/user-streak.entity';
import { User } from '../users/entities/user.entity';
import { PlayerLevel } from './entities/player-level.entity';
import { XpAward } from './entities/xp-award.entity';
import { XpController } from './xp.controller';
import { XpService } from './xp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerLevel, XpAward, User, UserStreak, PrivacySettings]),
    AuthModule,
  ],
  controllers: [XpController],
  providers: [XpService],
  exports: [XpService],
})
export class XpModule {}
