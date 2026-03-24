import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementController } from './achievement.controller';
import { AchievementNotificationService } from './achievement-notification.service';
import { AchievementService } from './achievement.service';
import { AchievementHistory } from './entities/achievement-history.entity';
import { AchievementProgress } from './entities/achievement-progress.entity';
import { Achievement } from './entities/achievement.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      AchievementProgress,
      Badge,
      UserBadge,
      AchievementHistory,
    ]),
  ],
  controllers: [AchievementController],
  providers: [AchievementService, AchievementNotificationService],
  exports: [AchievementService],
})
export class AchievementModule {}
