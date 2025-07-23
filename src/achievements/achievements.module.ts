import { Module } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';

@Module({
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
