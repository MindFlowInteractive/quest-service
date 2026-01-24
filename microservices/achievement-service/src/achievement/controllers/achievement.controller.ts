import { Controller, Get, Param } from '@nestjs/common';
import { AchievementService } from '../services/achievement.service';
import { AchievementProgressService } from '../services/achievement-progress.service';
import { AchievementHistoryService } from '../services/achievement-history.service';

@Controller()
export class AchievementController {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly progressService: AchievementProgressService,
    private readonly historyService: AchievementHistoryService,
  ) {}

  @Get('achievements')
  getAchievements() {
    return this.achievementService.findAll();
  }

  @Get('users/:userId/achievements')
  getUserAchievements(@Param('userId') userId: string) {
    return this.progressService.getUserProgress(userId);
  }

  @Get('users/:userId/achievement-history')
  getUserAchievementHistory(@Param('userId') userId: string) {
    return this.historyService.getUserHistory(userId);
  }
}
