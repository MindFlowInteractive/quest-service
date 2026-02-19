import { Controller, Get, Param, ParseUUIDPipe, Patch, Body } from '@nestjs/common';
import { UserProgressService } from '../services/user-progress.service';

@Controller('user-progress')
export class UserProgressController {
  constructor(private readonly userProgressService: UserProgressService) {}

  @Get(':userId')
  async getProgress(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userProgressService.getProgress(userId);
  }

  @Patch(':userId/xp')
  async addXp(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('xp') xp: number,
  ) {
    return this.userProgressService.addXp(userId, xp);
  }

  @Patch(':userId/puzzle-completed')
  async recordPuzzleCompletion(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('puzzleId') puzzleId: string,
  ) {
    return this.userProgressService.recordPuzzleCompletion(userId, puzzleId);
  }
}
