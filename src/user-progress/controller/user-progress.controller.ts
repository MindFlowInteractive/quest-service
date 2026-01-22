import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UserProgressService } from '../services/user-progress.service';
import { UserProgress } from '../entities/user-progress.entity';


@Controller('user-progress')
export class UserProgressController {
  constructor(private readonly userProgressService: UserProgressService) {}

  @Get(':userId')
  async getUserProgress(@Param('userId') userId: string) {
    return this.userProgressService.getOrCreateProgress({ id: userId } as any);
  }

  @Post('puzzle-completed/:userId')
completePuzzle(@Param('userId') userId: string) {
  return this.userProgressService.incrementPuzzlesCompleted(userId);
}

@Get('analytics/xp-distribution')
  getXpDistribution() {
    return this.userProgressService.getXpDistribution();
  }

  @Get('analytics/achievements-summary')
  getAchievementsSummary() {
    return this.userProgressService.getAchievementsSummary();
  }

  @Get('analytics/top-streaks')
  getTopStreaks() {
    return this.userProgressService.getTopStreaks();
  }

  @Get('leaderboard/xp')
getXpLeaderboard() {
  return this.userProgressService.getTopUsersByXp(10);
}

@Get('backup')
backupAllProgress() {
  return this.userProgressService.backupAllProgress();
}

}
