import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { StreaksService } from './streaks.service';
import { StreakType } from './entities/user-streak.entity';

@Controller('streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Post('event')
  async recordEvent(@Body() body: { userId: string; type: 'PUZZLE_COMPLETE' }) {
    return this.streaksService.recordActivity(body.userId, body.type);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('type') type: StreakType) {
    return this.streaksService.getLeaderboard(type || StreakType.DAILY);
  }

  @Post('recover')
  async recoverStreak(@Body() body: { userId: string }) {
    return this.streaksService.recoverStreak(body.userId);
  }

  @Get(':userId')
  async getUserStreaks(@Param('userId') userId: string) {
    return this.streaksService.getStreaks(userId);
  }
}
