import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AchievementConditionEngine } from './achievement-condition.engine';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, UserAchievement]), NotificationsModule],
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementConditionEngine],
  exports: [AchievementsService],
})
export class AchievementsModule {}
