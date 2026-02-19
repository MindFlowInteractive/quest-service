/**
 * Puzzle Preview Controller
 * Handles puzzle testing and preview endpoints
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PuzzleEditorService } from '../services/puzzle-editor.service';
import { PuzzlePreviewService } from '../services/puzzle-preview.service';
import { StartPreviewSessionDto, RecordPreviewMoveDto } from '../dto';

@ApiTags('Puzzle Preview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('puzzle-editor/:editorId/preview')
export class PuzzlePreviewController {
  constructor(
    private editorService: PuzzleEditorService,
    private previewService: PuzzlePreviewService,
  ) {}

  /**
   * Start preview session
   */
  @Post('/sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a preview/testing session' })
  @ApiResponse({ status: 201, description: 'Preview session started' })
  async startSession(
    @Param('editorId') editorId: string,
    @Body() dto: StartPreviewSessionDto,
    @Request() req: any,
  ) {
    const editor = await this.editorService.getEditor(editorId, req.user.id);

    return this.previewService.startPreviewSession(
      editorId,
      editor.components,
      editor.connections,
      dto.config,
    );
  }

  /**
   * Get preview session
   */
  @Get('/sessions/:sessionId')
  @ApiOperation({ summary: 'Get preview session details' })
  @ApiResponse({ status: 200, description: 'Preview session details' })
  async getSession(
    @Param('editorId') editorId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    // Verify user has access to editor
    await this.editorService.getEditor(editorId, req.user.id);

    return this.previewService.getPreviewSession(sessionId);
  }

  /**
   * Record move in preview
   */
  @Post('/sessions/:sessionId/moves')
  @ApiOperation({ summary: 'Record a move in preview session' })
  @ApiResponse({ status: 200, description: 'Move recorded' })
  async recordMove(
    @Param('editorId') editorId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: RecordPreviewMoveDto,
    @Request() req: any,
  ) {
    // Verify user has access to editor
    await this.editorService.getEditor(editorId, req.user.id);

    return this.previewService.recordMove(sessionId, dto.action, dto.details || {}, dto.metadata);
  }

  /**
   * Undo move in preview
   */
  @Post('/sessions/:sessionId/undo')
  @ApiOperation({ summary: 'Undo last move in preview' })
  @ApiResponse({ status: 200, description: 'Move undone' })
  async undoMove(
    @Param('editorId') editorId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    // Verify user has access to editor
    await this.editorService.getEditor(editorId, req.user.id);

    return this.previewService.undoMove(sessionId);
  }

  /**
   * Reset preview
   */
  @Post('/sessions/:sessionId/reset')
  @ApiOperation({ summary: 'Reset preview to initial state' })
  @ApiResponse({ status: 200, description: 'Preview reset' })
  async resetPreview(
    @Param('editorId') editorId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    // Verify user has access to editor
    await this.editorService.getEditor(editorId, req.user.id);

    return this.previewService.resetPreview(sessionId);
  }

  /**
   * Get replay
   */
  @Get('/sessions/:sessionId/replay')
  @ApiOperation({ summary: 'Get session replay recording' })
  @ApiResponse({ status: 200, description: 'Replay data' })
  async getReplay(
    @Param('editorId') editorId: string,
    @Param('sessionId') sessionId: string,
    @Query('speed') speed: number = 1.0,
    @Request() req: any,
  ) {
    // Verify user has access to editor
    await this.editorService.getEditor(editorId, req.user.id);

    return this.previewService.replaySession(sessionId, speed);
  }

  /**
   * End preview session
   */
  @Post('/sessions/:sessionId/end')
  @ApiOperation({ summary: 'End preview session' })
  @ApiResponse({ status: 204, description: 'Session ended' })
  async endSession(
    @Param('editorId') editorId: string,
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    // Verify user has access to editor
    await this.editorService.getEditor(editorId, req.user.id);

    await this.previewService.endPreviewSession(sessionId);
  }

  /**
   * Test puzzle
   */
  @Post('/test')
  @ApiOperation({ summary: 'Run automated tests on puzzle' })
  @ApiResponse({ status: 200, description: 'Test results' })
  async testPuzzle(
    @Param('editorId') editorId: string,
    @Query('attempts') attempts: number = 5,
    @Query('maxTime') maxTime: number = 5000,
    @Request() req: any,
  ) {
    const editor = await this.editorService.getEditor(editorId, req.user.id);

    const results = await this.previewService.testPuzzle(
      editor.components,
      editor.connections,
      {
        attempts,
        maxTimePerAttempt: maxTime,
        recordMetrics: true,
      },
    );

    // Save test results to editor activity
    return results;
  }
}
