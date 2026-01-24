import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Achievement } from './entities/achievement.entity';
import { AchievementProgress } from './entities/achievement-progress.entity';
import { Badge } from './entities/badge.entity';
import { AchievementService } from './services/achievement.service';
import { AchievementProgressService } from './services/achievement-progress.service';
import { AchievementUnlockService } from './services/achievement-unlock.service';
import { BadgeService } from './services/badge.service';
import { AchievementHistoryService } from './services/achievement-history.service';
import { AchievementNotificationService } from './services/achievement-notification.service';
import { AchievementController } from './controllers/achievement.controller';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Achievement, AchievementProgress, Badge])],
  providers: [
    AchievementService,
    AchievementProgressService,
    AchievementUnlockService,
    BadgeService,
    AchievementHistoryService,
    AchievementNotificationService,
  ],
  controllers: [AchievementController],
})
export class AchievementModule {}
