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
  HttpStatus,
} from '@nestjs/common';
import {
  SeasonalEventService,
  EventPuzzleService,
  PlayerEventService,
  LeaderboardService,
  EventRewardService,
} from './services';
import {
  CreateEventDto,
  CreatePuzzleDto,
  CreateRewardDto,
  SubmitAnswerDto,
} from './dto';
@Controller('seasonal-events')
export class SeasonalEventsController {
  constructor(
    private readonly eventService: SeasonalEventService,
    private readonly puzzleService: EventPuzzleService,
    private readonly playerEventService: PlayerEventService,
    private readonly leaderboardService: LeaderboardService,
    private readonly rewardService: EventRewardService,
  ) {}

  // ==================== EVENT ENDPOINTS ====================

  /**
   * Get all active events
   */
  @Get('active')
  async getActiveEvents() {
    return await this.eventService.findActiveEvents();
  }

  /**
   * Get all events (with optional filters)
   */
  @Get()
  async getAllEvents(
    @Query('isActive') isActive?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (isPublished !== undefined) filters.isPublished = isPublished === 'true';

    return await this.eventService.findAll(filters);
  }

  /**
   * Get upcoming events
   */
  @Get('upcoming')
  async getUpcomingEvents() {
    return await this.eventService.findUpcomingEvents();
  }

  /**
   * Get past events (ended, not yet archived)
   */
  @Get('past')
  async getPastEvents(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.eventService.findPastEvents(limitNum);
  }

  /**
   * Get archived events (event history)
   */
  @Get('archived')
  async getArchivedEvents(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return await this.eventService.findArchivedEvents(limitNum);
  }

  /**
   * Get global leaderboard across all events
   * NOTE: must be declared before /:eventId to avoid route conflict
   */
  @Get('leaderboard/global')
  async getGlobalLeaderboard(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.leaderboardService.getGlobalLeaderboard(limitNum);
  }

  /**
   * Get all events a player has participated in
   * NOTE: must be declared before /:eventId to avoid route conflict
   */
  @Get('player/:playerId/events')
  async getPlayerEvents(@Param('playerId') playerId: string) {
    return await this.playerEventService.getPlayerEvents(playerId);
  }

  /**
   * Get a specific event by ID
   */
  @Get(':eventId')
  async getEvent(@Param('eventId') eventId: string) {
    return await this.eventService.findOne(eventId);
  }

  /**
   * Get event statistics
   */
  @Get(':eventId/statistics')
  async getEventStatistics(@Param('eventId') eventId: string) {
    return await this.eventService.getEventStatistics(eventId);
  }

  /**
   * Create a new event (Admin only)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEvent(@Body() createEventDto: CreateEventDto) {
    return await this.eventService.createEvent(createEventDto);
  }

  /**
   * Update an event (Admin only)
   */
  @Put(':eventId')
  async updateEvent(
    @Param('eventId') eventId: string,
    @Body() updateData: Partial<CreateEventDto>,
  ) {
    return await this.eventService.updateEvent(eventId, updateData);
  }

  /**
   * Delete an event (Admin only)
   */
  @Delete(':eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(@Param('eventId') eventId: string) {
    await this.eventService.deleteEvent(eventId);
  }

  /**
   * Archive an event (Admin only) — soft archive for history retention
   */
  @Post(':eventId/archive')
  async archiveEvent(@Param('eventId') eventId: string) {
    return await this.eventService.archiveEvent(eventId);
  }

  // ==================== PUZZLE ENDPOINTS ====================

  /**
   * Get all puzzles for an event
   */
  @Get(':eventId/puzzles')
  async getEventPuzzles(@Param('eventId') eventId: string) {
    return await this.puzzleService.findPuzzlesByEvent(eventId);
  }

  /**
   * Get puzzles by category
   */
  @Get(':eventId/puzzles/category/:category')
  async getPuzzlesByCategory(
    @Param('eventId') eventId: string,
    @Param('category') category: string,
  ) {
    return await this.puzzleService.findPuzzlesByCategory(eventId, category);
  }

  /**
   * Get event categories
   */
  @Get(':eventId/categories')
  async getEventCategories(@Param('eventId') eventId: string) {
    return await this.puzzleService.getEventCategories(eventId);
  }

  /**
   * Get a specific puzzle
   */
  @Get(':eventId/puzzles/:puzzleId')
  async getPuzzle(@Param('puzzleId') puzzleId: string) {
    return await this.puzzleService.findOne(puzzleId);
  }

  /**
   * Get puzzle statistics
   */
  @Get(':eventId/puzzles/:puzzleId/statistics')
  async getPuzzleStatistics(@Param('puzzleId') puzzleId: string) {
    return await this.puzzleService.getPuzzleStatistics(puzzleId);
  }

  /**
   * Create a new puzzle for an event (Admin only)
   */
  @Post(':eventId/puzzles')
  @HttpCode(HttpStatus.CREATED)
  async createPuzzle(@Body() createPuzzleDto: CreatePuzzleDto) {
    return await this.puzzleService.createPuzzle(createPuzzleDto);
  }

  /**
   * Update a puzzle (Admin only)
   */
  @Put(':eventId/puzzles/:puzzleId')
  async updatePuzzle(
    @Param('puzzleId') puzzleId: string,
    @Body() updateData: Partial<CreatePuzzleDto>,
  ) {
    return await this.puzzleService.updatePuzzle(puzzleId, updateData);
  }

  /**
   * Delete a puzzle (Admin only)
   */
  @Delete(':eventId/puzzles/:puzzleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePuzzle(@Param('puzzleId') puzzleId: string) {
    await this.puzzleService.deletePuzzle(puzzleId);
  }

  // ==================== PLAYER PROGRESS ENDPOINTS ====================

  /**
   * Submit a puzzle answer
   * In production, playerId should come from authenticated user
   */
  @Post(':eventId/submit')
  async submitAnswer(
    @Param('eventId') eventId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Query('playerId') playerId: string,
  ) {
    return await this.playerEventService.submitAnswer(
      playerId,
      eventId,
      submitAnswerDto,
    );
  }

  /**
   * Get player's progress in an event
   */
  @Get(':eventId/progress/:playerId')
  async getPlayerProgress(
    @Param('eventId') eventId: string,
    @Param('playerId') playerId: string,
  ) {
    return await this.playerEventService.getPlayerProgress(playerId, eventId);
  }

  /**
   * Get player's rank in an event
   */
  @Get(':eventId/rank/:playerId')
  async getPlayerRank(
    @Param('eventId') eventId: string,
    @Param('playerId') playerId: string,
  ) {
    return await this.playerEventService.getPlayerRank(playerId, eventId);
  }

  // ==================== LEADERBOARD ENDPOINTS ====================

  /**
   * Get event leaderboard (top 10 by default)
   */
  @Get(':eventId/leaderboard')
  async getLeaderboard(
    @Param('eventId') eventId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.leaderboardService.getEventLeaderboard(eventId, limitNum);
  }

  /**
   * Get leaderboard with player's position
   */
  @Get(':eventId/leaderboard/player/:playerId')
  async getLeaderboardWithPlayer(
    @Param('eventId') eventId: string,
    @Param('playerId') playerId: string,
    @Query('topCount') topCount?: string,
  ) {
    const topCountNum = topCount ? parseInt(topCount, 10) : 10;
    return await this.leaderboardService.getLeaderboardWithPlayer(
      eventId,
      playerId,
      topCountNum,
    );
  }

  /**
   * Get category leaderboard
   */
  @Get(':eventId/leaderboard/category/:category')
  async getCategoryLeaderboard(
    @Param('eventId') eventId: string,
    @Param('category') category: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.leaderboardService.getCategoryLeaderboard(
      eventId,
      category,
      limitNum,
    );
  }

  /**
   * Get streak leaderboard
   */
  @Get(':eventId/leaderboard/streak')
  async getStreakLeaderboard(
    @Param('eventId') eventId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.leaderboardService.getStreakLeaderboard(eventId, limitNum);
  }

  /**
   * Get speed leaderboard
   */
  @Get(':eventId/leaderboard/speed')
  async getSpeedLeaderboard(
    @Param('eventId') eventId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return await this.leaderboardService.getSpeedLeaderboard(eventId, limitNum);
  }

  // ==================== REWARD ENDPOINTS ====================

  /**
   * Get all rewards for an event
   */
  @Get(':eventId/rewards')
  async getEventRewards(@Param('eventId') eventId: string) {
    return await this.rewardService.findActiveRewardsByEvent(eventId);
  }

  /**
   * Get rewards by type
   */
  @Get(':eventId/rewards/type/:type')
  async getRewardsByType(
    @Param('eventId') eventId: string,
    @Param('type') type: 'points' | 'badge' | 'item' | 'currency' | 'title' | 'avatar' | 'nft',
  ) {
    return await this.rewardService.findRewardsByType(eventId, type);
  }

  /**
   * Get available rewards for a player
   */
  @Get(':eventId/rewards/available/:playerId')
  async getAvailableRewards(
    @Param('eventId') eventId: string,
    @Param('playerId') playerId: string,
  ) {
    const playerProgress = await this.playerEventService.getPlayerProgress(
      playerId,
      eventId,
    );
    return await this.rewardService.getAvailableRewards(
      eventId,
      playerProgress.score,
      playerProgress.puzzlesCompleted,
    );
  }

  /**
   * Create a new reward (Admin only)
   */
  @Post(':eventId/rewards')
  @HttpCode(HttpStatus.CREATED)
  async createReward(@Body() createRewardDto: CreateRewardDto) {
    return await this.rewardService.createReward(createRewardDto);
  }

  /**
   * Update a reward (Admin only)
   */
  @Put(':eventId/rewards/:rewardId')
  async updateReward(
    @Param('rewardId') rewardId: string,
    @Body() updateData: Partial<CreateRewardDto>,
  ) {
    return await this.rewardService.updateReward(rewardId, updateData);
  }

  /**
   * Delete a reward (Admin only)
   */
  @Delete(':eventId/rewards/:rewardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReward(@Param('rewardId') rewardId: string) {
    await this.rewardService.deleteReward(rewardId);
  }

  // ==================== ANNOUNCEMENT ENDPOINT ====================

  /**
   * Announce an event — broadcasts notification to all active users
   */
  @Post(':eventId/announce')
  async announceEvent(@Param('eventId') eventId: string) {
    const event = await this.eventService.findOne(eventId);
    await this.eventService.announceEvent(event);

    return {
      message: 'Event announcement sent',
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
      },
    };
  }
}
