import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, UserAchievement])],
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
