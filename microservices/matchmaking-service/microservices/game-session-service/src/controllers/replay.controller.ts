import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReplayService } from '../services/replay.service';
import { RecordMoveDto } from '../dto/record-move.dto';
import { PlaybackOptionsDto } from '../dto/playback-options.dto';

@Controller('replays')
export class ReplayController {
  constructor(private readonly replayService: ReplayService) {}

  @Post('session/:sessionId/start')
  @HttpCode(HttpStatus.CREATED)
  async startRecording(
    @Param('sessionId') sessionId: string,
    @Body() body: { initialState: Record<string, any> },
  ) {
    const replay = await this.replayService.startRecording(
      sessionId,
      body.initialState,
    );
    return {
      message: 'Recording started successfully',
      replay,
    };
  }

  @Post('session/:sessionId/stop')
  async stopRecording(@Param('sessionId') sessionId: string) {
    const replay = await this.replayService.stopRecording(sessionId);
    return {
      message: 'Recording stopped successfully',
      replay,
    };
  }

  @Post('moves')
  @HttpCode(HttpStatus.CREATED)
  async recordMove(@Body() dto: RecordMoveDto) {
    const replay = await this.replayService.recordMove(dto);
    return {
      message: 'Move recorded successfully',
      replay,
    };
  }

  @Post('snapshots')
  @HttpCode(HttpStatus.CREATED)
  async recordSnapshot(
    @Body()
    dto: {
      sessionId: string;
      snapshotId: string;
      step: number;
      state: any;
    },
  ) {
    const replay = await this.replayService.recordSnapshot(
      dto.sessionId,
      dto.snapshotId,
      dto.step,
      dto.state,
    );
    return {
      message: 'Snapshot recorded successfully',
      replay,
    };
  }

  @Get('session/:sessionId')
  async getReplayBySessionId(@Param('sessionId') sessionId: string) {
    const replay = await this.replayService.getReplayBySessionId(sessionId);
    return {
      message: 'Replay retrieved successfully',
      replay,
    };
  }

  @Get(':replayId')
  async getReplayById(@Param('replayId') replayId: string) {
    const replay = await this.replayService.getReplayById(replayId);
    return {
      message: 'Replay retrieved successfully',
      replay,
    };
  }

  @Get('user/:userId')
  async getReplaysByUserId(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    const replays = await this.replayService.getReplaysByUserId(
      userId,
      limit ? parseInt(limit.toString(), 10) : 20,
    );
    return {
      message: 'Replays retrieved successfully',
      replays,
      count: replays.length,
    };
  }

  @Post(':replayId/play')
  async playReplay(
    @Param('replayId') replayId: string,
    @Body() options: PlaybackOptionsDto,
  ) {
    const playback = await this.replayService.playReplay(replayId, options);
    return {
      message: 'Replay playback prepared successfully',
      ...playback,
    };
  }

  @Patch(':replayId/metadata')
  async updateMetadata(
    @Param('replayId') replayId: string,
    @Body() metadata: Record<string, any>,
  ) {
    const replay = await this.replayService.updateMetadata(
      replayId,
      metadata,
    );
    return {
      message: 'Replay metadata updated successfully',
      replay,
    };
  }

  @Delete(':replayId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReplay(@Param('replayId') replayId: string) {
    await this.replayService.deleteReplay(replayId);
  }
}
