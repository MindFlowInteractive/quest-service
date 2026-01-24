import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  BadRequestException,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { CreateReplayInput, RecordActionInput, PlaybackOptions } from './replay.service';
import { ReplayService } from './replay.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Replay, PrivacyLevel } from '../entities/replay.entity';
import { Action, ActionType } from '../entities/action.entity';
import { Recording } from '../entities/recording.entity';

@ApiTags('replay')
@Controller('replay')
@UseInterceptors(ClassSerializerInterceptor)
export class ReplayController {
  constructor(
    private readonly replayService: ReplayService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ==================== Replay CRUD ====================

  @Post('create')
  @ApiOperation({ summary: 'Create a new replay session' })
  @ApiResponse({ status: 201, description: 'Replay created', type: Replay })
  async createReplay(@Body() input: CreateReplayInput): Promise<Replay> {
    return this.replayService.createReplay(input);
  }

  @Get(':replayId')
  @ApiOperation({ summary: 'Get a replay by ID' })
  @ApiResponse({ status: 200, description: 'Replay found', type: Replay })
  async getReplay(
    @Param('replayId') replayId: string,
    @Query('viewerId') viewerId?: number,
  ): Promise<Replay> {
    return this.replayService.getReplay(replayId, viewerId);
  }

  @Get('puzzle/:puzzleId')
  @ApiOperation({ summary: 'Get all replays for a puzzle' })
  @ApiResponse({ status: 200, description: 'Replays found' })
  async getPuzzleReplays(
    @Param('puzzleId') puzzleId: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @Query('viewerId') viewerId?: number,
  ): Promise<{ data: Replay[]; total: number }> {
    return this.replayService.getPuzzleReplays(parseInt(puzzleId), limit, offset, viewerId);
  }

  @Get('player/:playerId')
  @ApiOperation({ summary: 'Get all replays by a player' })
  @ApiResponse({ status: 200, description: 'Player replays found' })
  async getPlayerReplays(
    @Param('playerId') playerId: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
    @Query('viewerId') viewerId?: number,
  ): Promise<{ data: Replay[]; total: number }> {
    return this.replayService.getPlayerReplays(parseInt(playerId), limit, offset, viewerId);
  }

  @Delete(':replayId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a replay' })
  async deleteReplay(
    @Param('replayId') replayId: string,
    @Query('playerId') playerId: number,
  ): Promise<void> {
    return this.replayService.deleteReplay(replayId, playerId);
  }

  // ==================== Action Recording ====================

  @Post(':replayId/action')
  @ApiOperation({ summary: 'Record a single action' })
  @ApiResponse({ status: 201, description: 'Action recorded', type: Action })
  async recordAction(
    @Param('replayId') replayId: string,
    @Body() input: Omit<RecordActionInput, 'replayId'>,
  ): Promise<Action> {
    return this.replayService.recordAction({
      ...input,
      replayId,
    });
  }

  @Post(':replayId/actions')
  @ApiOperation({ summary: 'Record multiple actions (batch)' })
  @ApiResponse({ status: 201, description: 'Actions recorded', type: [Action] })
  async recordActions(
    @Param('replayId') replayId: string,
    @Body() inputs: Array<Omit<RecordActionInput, 'replayId'>>,
  ): Promise<Action[]> {
    return this.replayService.recordActions(
      inputs.map((input) => ({
        ...input,
        replayId,
      })),
    );
  }

  @Get(':replayId/actions')
  @ApiOperation({ summary: 'Get all actions for a replay' })
  @ApiResponse({ status: 200, description: 'Actions found', type: [Action] })
  async getActions(
    @Param('replayId') replayId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Action[]> {
    return this.replayService.getActions(replayId, limit, offset);
  }

  // ==================== Playback ====================

  @Post(':replayId/playback')
  @ApiOperation({ summary: 'Generate playback data with optional speed adjustment' })
  @ApiResponse({ status: 200, description: 'Playback data generated' })
  async generatePlayback(
    @Param('replayId') replayId: string,
    @Body() options: PlaybackOptions = {},
  ): Promise<any> {
    return this.replayService.generatePlayback(replayId, options);
  }

  // ==================== Recording & Storage ====================

  @Post(':replayId/save')
  @ApiOperation({ summary: 'Save and compress a replay recording' })
  @ApiResponse({ status: 201, description: 'Recording saved', type: Recording })
  async saveRecording(
    @Param('replayId') replayId: string,
    @Body() metadata?: any,
  ): Promise<Recording> {
    return this.replayService.saveRecording(replayId, metadata);
  }

  @Get('recording/:recordingId')
  @ApiOperation({ summary: 'Get a recording' })
  @ApiResponse({ status: 200, description: 'Recording found', type: Recording })
  async getRecording(
    @Param('recordingId') recordingId: string,
  ): Promise<Recording> {
    return this.replayService.getRecording(recordingId);
  }

  @Get('recording/:recordingId/retrieve')
  @ApiOperation({ summary: 'Retrieve a complete replay from storage' })
  @ApiResponse({ status: 200, description: 'Replay data retrieved' })
  async retrieveRecording(
    @Param('recordingId') recordingId: string,
  ): Promise<any> {
    return this.replayService.retrieveRecording(recordingId);
  }

  @Delete('recording/:recordingId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a recording' })
  async deleteRecording(
    @Param('recordingId') recordingId: string,
  ): Promise<void> {
    return this.replayService.deleteRecording(recordingId);
  }

  // ==================== Privacy & Sharing ====================

  @Put(':replayId/privacy')
  @ApiOperation({ summary: 'Update replay privacy level' })
  @ApiResponse({ status: 200, description: 'Privacy updated', type: Replay })
  async updatePrivacy(
    @Param('replayId') replayId: string,
    @Query('playerId') playerId: number,
    @Body('privacyLevel') privacyLevel: PrivacyLevel,
  ): Promise<Replay> {
    if (!Object.values(PrivacyLevel).includes(privacyLevel)) {
      throw new BadRequestException('Invalid privacy level');
    }
    return this.replayService.updatePrivacy(replayId, playerId, privacyLevel);
  }

  @Post(':replayId/share')
  @ApiOperation({ summary: 'Share a replay with specific users' })
  @ApiResponse({ status: 200, description: 'Replay shared', type: Replay })
  async shareReplay(
    @Param('replayId') replayId: string,
    @Query('playerId') playerId: number,
    @Body('userIds') userIds: number[],
  ): Promise<Replay> {
    return this.replayService.shareReplay(replayId, playerId, userIds);
  }

  @Delete(':replayId/share/:userId')
  @ApiOperation({ summary: 'Revoke access from a user' })
  @ApiResponse({ status: 200, description: 'Access revoked', type: Replay })
  async revokeAccess(
    @Param('replayId') replayId: string,
    @Param('userId') userId: number,
    @Query('playerId') playerId: number,
  ): Promise<Replay> {
    return this.replayService.revokeAccess(replayId, playerId, userId);
  }

  @Get('share/:token')
  @ApiOperation({ summary: 'Get replay by share token' })
  @ApiResponse({ status: 200, description: 'Replay found', type: Replay })
  async getReplayByToken(
    @Param('token') token: string,
  ): Promise<Replay> {
    return this.replayService.getReplayByToken(token);
  }

  // ==================== Analytics ====================

  @Get(':replayId/analytics')
  @ApiOperation({ summary: 'Generate analytics for a replay' })
  @ApiResponse({ status: 200, description: 'Analytics generated' })
  async generateAnalytics(
    @Param('replayId') replayId: string,
  ): Promise<any> {
    return this.analyticsService.generateAnalytics(replayId);
  }

  @Post('analytics/compare')
  @ApiOperation({ summary: 'Compare analytics across multiple replays' })
  @ApiResponse({ status: 200, description: 'Comparison complete' })
  async compareReplays(
    @Body('replayIds') replayIds: string[],
  ): Promise<any> {
    if (!Array.isArray(replayIds) || replayIds.length < 2) {
      throw new BadRequestException('At least 2 replay IDs required for comparison');
    }
    return this.analyticsService.compareReplays(replayIds);
  }
}
