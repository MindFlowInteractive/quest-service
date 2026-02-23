import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ReplayService } from '../services/replay.service';
import { ReplayCompressionService } from '../services/replay-compression.service';
import { ReplayComparisonService } from '../services/replay-comparison.service';
import { ReplayAnalyticsService } from '../services/replay-analytics.service';
import {
  CreateReplayDto,
  RecordActionDto,
  CompleteReplayDto,
  ShareReplayDto,
} from '../dto/create-replay.dto';
import { ReplayPlaybackDto } from '../dto/replay-playback.dto';

/**
 * Controller for replay endpoints
 * Handles creation, recording, playback, sharing, and comparison of puzzle replays
 */
@Controller('replays')
export class ReplayController {
  constructor(
    private readonly replayService: ReplayService,
    private readonly compressionService: ReplayCompressionService,
    private readonly comparisonService: ReplayComparisonService,
    private readonly analyticsService: ReplayAnalyticsService,
  ) {}

  /**
   * Create a new replay session
   * POST /replays
   */
  @Post()
  async createReplay(@Body() createDto: CreateReplayDto, @Req() req: Request) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    return this.replayService.createReplay(userId, createDto);
  }

  /**
   * Record an action during gameplay
   * POST /replays/:replayId/actions
   */
  @Post(':replayId/actions')
  async recordAction(
    @Param('replayId') replayId: string,
    @Body() actionDto: RecordActionDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    // Verify ownership
    const replay = await this.replayService.getReplay(replayId);
    if (replay.userId !== userId) {
      throw new ForbiddenException('You can only record actions on your own replays');
    }

    return this.replayService.recordAction(replayId, actionDto);
  }

  /**
   * Complete a replay session
   * PATCH /replays/:replayId/complete
   */
  @Patch(':replayId/complete')
  async completeReplay(
    @Param('replayId') replayId: string,
    @Body() completeDto: CompleteReplayDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    const replay = await this.replayService.getReplay(replayId);
    if (replay.userId !== userId) {
      throw new ForbiddenException('You can only complete your own replays');
    }

    return this.replayService.completeReplay(replayId, completeDto);
  }

  /**
   * Get replay by ID
   * GET /replays/:replayId
   */
  @Get(':replayId')
  async getReplay(@Param('replayId') replayId: string, @Req() req: Request) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;

    const replay = await this.replayService.getReplay(replayId);

    // Only owner or public replays can be accessed
    if (replay.userId !== userId && replay.permission !== 'public') {
      throw new ForbiddenException('You do not have access to this replay');
    }

    return replay;
  }

  /**
   * Get playback data for a replay
   * GET /replays/:replayId/playback
   */
  @Get(':replayId/playback')
  async getPlayback(@Param('replayId') replayId: string, @Req() req: Request) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;

    const replay = await this.replayService.getReplay(replayId);

    // Access control
    if (replay.userId !== userId && replay.permission !== 'public') {
      throw new ForbiddenException('You do not have access to this replay');
    }

    // Increment view count
    await this.replayService.recordAnalytic(replayId, 'VIEW', {
      viewedAt: new Date(),
      viewerUserId: userId || 'anonymous',
    });

    return this.replayService.getPlaybackData(replayId);
  }

  /**
   * Get user's replays
   * GET /replays (requires auth)
   */
  @Get()
  async getUserReplays(
    @Req() req: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('puzzleId') puzzleId?: string,
    @Query('isCompleted') isCompleted?: string,
    @Query('isSolved') isSolved?: string,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    const filters = {
      puzzleId,
      isCompleted: isCompleted !== undefined ? isCompleted === 'true' : undefined,
      isSolved: isSolved !== undefined ? isSolved === 'true' : undefined,
    };

    return this.replayService.getUserReplays(userId, page, limit, filters);
  }

  /**
   * Share a replay
   * PATCH /replays/:replayId/share
   */
  @Patch(':replayId/share')
  async shareReplay(
    @Param('replayId') replayId: string,
    @Body() shareDto: ShareReplayDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    return this.replayService.shareReplay(replayId, userId, shareDto);
  }

  /**
   * Get public replays for a puzzle (learning resources)
   * GET /replays/puzzle/:puzzleId/public
   */
  @Get('puzzle/:puzzleId/public')
  async getPublicReplays(
    @Param('puzzleId') puzzleId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.replayService.getPublicReplays(puzzleId, page, limit);
  }

  /**
   * Get a shared replay via share code (public access)
   * GET /replays/shared/:shareCode
   */
  @Get('shared/:shareCode')
  async getSharedReplay(@Param('shareCode') shareCode: string) {
    return this.replayService.getSharedReplay(shareCode);
  }

  /**
   * Compare two replays
   * POST /replays/compare
   */
  @Post('compare')
  async compareReplays(
    @Body('originalReplayId') originalReplayId: string,
    @Body('newReplayId') newReplayId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    if (!originalReplayId || !newReplayId) {
      throw new BadRequestException('Both replay IDs are required');
    }

    // Verify ownership of at least one replay
    const [originalReplay, newReplay] = await Promise.all([
      this.replayService.getReplay(originalReplayId),
      this.replayService.getReplay(newReplayId),
    ]);

    if (originalReplay.userId !== userId && newReplay.userId !== userId) {
      throw new ForbiddenException('You can only compare your own replays');
    }

    return this.comparisonService.compareReplays(originalReplayId, newReplayId);
  }

  /**
   * Get comparison summary
   * GET /replays/compare/:originalReplayId/:newReplayId/summary
   */
  @Get('compare/:originalReplayId/:newReplayId/summary')
  async getComparisonSummary(
    @Param('originalReplayId') originalReplayId: string,
    @Param('newReplayId') newReplayId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    const [originalReplay, newReplay] = await Promise.all([
      this.replayService.getReplay(originalReplayId),
      this.replayService.getReplay(newReplayId),
    ]);

    if (originalReplay.userId !== userId && newReplay.userId !== userId) {
      throw new ForbiddenException('You can only compare your own replays');
    }

    return this.comparisonService.getComparisonSummary(originalReplayId, newReplayId);
  }

  /**
   * Compress a replay for storage optimization
   * PATCH /replays/:replayId/compress
   */
  @Patch(':replayId/compress')
  async compressReplay(
    @Param('replayId') replayId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    const replay = await this.replayService.getReplay(replayId);
    if (replay.userId !== userId) {
      throw new ForbiddenException('You can only compress your own replays');
    }

    await this.compressionService.compressReplay(replayId);
    return { message: 'Replay compressed successfully' };
  }

  /**
   * Archive a replay for long-term storage
   * PATCH /replays/:replayId/archive
   */
  @Patch(':replayId/archive')
  async archiveReplay(
    @Param('replayId') replayId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    const replay = await this.replayService.getReplay(replayId);
    if (replay.userId !== userId) {
      throw new ForbiddenException('You can only archive your own replays');
    }

    const storageSize = await this.compressionService.archiveReplay(replayId);
    return { message: 'Replay archived', storageSize };
  }

  /**
   * Delete a replay
   * DELETE /replays/:replayId
   */
  @Delete(':replayId')
  async deleteReplay(
    @Param('replayId') replayId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    await this.replayService.deleteReplay(replayId, userId);
    return { message: 'Replay deleted successfully' };
  }

  /**
   * Get replay analytics
   * GET /replays/:replayId/analytics
   */
  @Get(':replayId/analytics')
  async getAnalytics(
    @Req() req: Request,
    @Param('replayId') replayId: string,
    @Query('metricType') metricType?: string,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    const replay = await this.replayService.getReplay(replayId);
    if (replay.userId !== userId && replay.permission !== 'public') {
      throw new ForbiddenException('You do not have access to this replay');
    }

    return this.replayService.getReplayAnalytics(replayId, metricType);
  }

  /**
   * Record difficulty rating for a replay
   * POST /replays/:replayId/difficulty-rating
   */
  @Post(':replayId/difficulty-rating')
  async recordDifficultyRating(
    @Param('replayId') replayId: string,
    @Body('rating') rating: number,
    @Req() req: Request,
  ) {
    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const replay = await this.replayService.getReplay(replayId);

    // Allow owner or users learning from this replay
    if (replay.permission !== 'public' && replay.userId !== (req.user as any)?.id) {
      throw new ForbiddenException('You cannot rate this replay');
    }

    return this.analyticsService.recordDifficultyRating(replayId, rating);
  }

  /**
   * Record learning effectiveness metric
   * POST /replays/:replayId/learning-effectiveness
   */
  @Post(':replayId/learning-effectiveness')
  async recordLearningEffectiveness(
    @Param('replayId') replayId: string,
    @Body('beforeScore') beforeScore: number,
    @Body('afterScore') afterScore: number,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id || (req.user as any)?.userId;
    if (!userId) {
      throw new ForbiddenException('User ID required');
    }

    if (beforeScore === undefined || afterScore === undefined) {
      throw new BadRequestException('Both beforeScore and afterScore are required');
    }

    return this.analyticsService.recordLearningEffectiveness(replayId, beforeScore, afterScore);
  }

  /**
   * Get puzzle completion analytics
   * GET /analytics/puzzles/:puzzleId/completion
   */
  @Get('analytics/puzzles/:puzzleId/completion')
  async getCompletionAnalytics(@Param('puzzleId') puzzleId: string) {
    return this.analyticsService.getCompletionAnalytics(puzzleId);
  }

  /**
   * Get top replays by views for a puzzle
   * GET /analytics/puzzles/:puzzleId/top-replays
   */
  @Get('analytics/puzzles/:puzzleId/top-replays')
  async getTopReplays(
    @Param('puzzleId') puzzleId: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.analyticsService.getTopReplaysByViews(puzzleId, limit);
  }

  /**
   * Get learning effectiveness summary for a puzzle
   * GET /analytics/puzzles/:puzzleId/learning-effectiveness
   */
  @Get('analytics/puzzles/:puzzleId/learning-effectiveness')
  async getLearningEffectivenessSummary(@Param('puzzleId') puzzleId: string) {
    return this.analyticsService.getLearningEffectivenessSummary(puzzleId);
  }

  /**
   * Get common strategies for a puzzle
   * GET /analytics/puzzles/:puzzleId/strategies
   */
  @Get('analytics/puzzles/:puzzleId/strategies')
  async getCommonStrategies(
    @Param('puzzleId') puzzleId: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.analyticsService.getCommonStrategies(puzzleId, limit);
  }

  /**
   * Get difficulty feedback for a puzzle
   * GET /analytics/puzzles/:puzzleId/difficulty-feedback
   */
  @Get('analytics/puzzles/:puzzleId/difficulty-feedback')
  async getDifficultyFeedback(@Param('puzzleId') puzzleId: string) {
    return this.analyticsService.getDifficultyFeedback(puzzleId);
  }

  /**
   * Get player learning progress across puzzles
   * GET /analytics/users/:userId/progress
   */
  @Get('analytics/users/:userId/progress')
  async getPlayerProgress(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 10,
    @Req() req: Request,
  ) {
    const currentUserId = (req.user as any)?.id || (req.user as any)?.userId;

    // Only allow users to see their own progress
    if (userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own progress');
    }

    return this.analyticsService.getPlayerLearningProgress(userId, limit);
  }
}
