import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { CreatePracticeSessionInput } from '../services/practice-mode.service';
import { PracticeModeService } from '../services/practice-mode.service';
import { DifficultyLevel } from '../types/puzzle.types';

@Controller('puzzles/practice')
export class PracticeModeController {
  constructor(private readonly practiceMode: PracticeModeService) {}

  @Post()
  startPractice(@Body() input: CreatePracticeSessionInput) {
    return this.practiceMode.startPractice(input);
  }

  @Post(':practiceSessionId/player/:playerId/attempts')
  submitAttempt(
    @Param('practiceSessionId') practiceSessionId: string,
    @Param('playerId') playerId: string,
    @Body() body: { answer: unknown },
  ) {
    return this.practiceMode.submitAttempt(
      practiceSessionId,
      playerId,
      body.answer,
    );
  }

  @Get(':practiceSessionId/player/:playerId/progress')
  getProgress(
    @Param('practiceSessionId') practiceSessionId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.practiceMode.getProgress(practiceSessionId, playerId);
  }

  @Get(':practiceSessionId/player/:playerId/hints/:level')
  getHint(
    @Param('practiceSessionId') practiceSessionId: string,
    @Param('playerId') playerId: string,
    @Param('level') level: string,
  ) {
    return this.practiceMode.getHint(
      practiceSessionId,
      playerId,
      Number(level),
    );
  }

  @Post(':practiceSessionId/player/:playerId/replay')
  replay(
    @Param('practiceSessionId') practiceSessionId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.practiceMode.replay(practiceSessionId, playerId);
  }

  @Patch(':practiceSessionId/player/:playerId/difficulty')
  adjustDifficulty(
    @Param('practiceSessionId') practiceSessionId: string,
    @Param('playerId') playerId: string,
    @Body() body: { difficulty: DifficultyLevel },
  ) {
    return this.practiceMode.adjustDifficulty(
      practiceSessionId,
      playerId,
      body.difficulty,
    );
  }

  @Get('player/:playerId/analytics')
  getPlayerAnalytics(@Param('playerId') playerId: string) {
    return this.practiceMode.getPlayerAnalytics(playerId);
  }
}
