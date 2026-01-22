import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService as ReplayService } from './app.service';

@Controller('replays')
export class ReplayController {
  constructor(private readonly replayService: ReplayService) {}

  @MessagePattern('PUZZLE_STARTED')
  async handlePuzzleStarted(@Payload() data: any) {
    return this.replayService.handlePuzzleStarted(data);
  }

  @MessagePattern('PUZZLE_MOVE')
  async handlePuzzleMove(@Payload() data: any) {
    return this.replayService.handlePuzzleMove(data);
  }

  @Get('latest/:puzzleId/:playerId')
  async getLatestReplay(
    @Param('puzzleId') puzzleId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.replayService.getLatestReplay(puzzleId, playerId);
  }

  @Get(':id')
  async getReplayById(@Param('id') id: string) {
    return this.replayService.getReplayById(id);
  }

  @Get(':id/compare')
  async compareState(
    @Param('id') id: string,
    @Query('moveIndex') moveIndex: string,
  ) {
    return this.replayService.getReplayCompareState(id, parseInt(moveIndex, 10));
  }
}
