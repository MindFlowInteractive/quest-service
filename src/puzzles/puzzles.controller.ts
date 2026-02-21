import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  ParseArrayPipe,
  BadRequestException,
  Logger,
  Req,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PuzzlesService, PuzzleWithStats, SearchResult, PuzzleAnalytics } from './puzzles.service';
import { SolutionSubmissionService } from './services/solution-submission.service';
import {
  CreatePuzzleDto,
  UpdatePuzzleDto,
  SearchPuzzleDto,
  BulkUpdateDto,
  PuzzleStatsDto
} from './dto';
import { SubmitSolutionDto } from './dto/submit-solution.dto';
import { SubmissionResultDto, SubmissionHistoryDto } from './dto/submission-result.dto';

@Controller('puzzles')
@UseInterceptors(ClassSerializerInterceptor)
export class PuzzlesController {
  private readonly logger = new Logger(PuzzlesController.name);

  constructor(
    private readonly puzzlesService: PuzzlesService,
    private readonly submissionService: SolutionSubmissionService,
  ) { }

  @Post()
  async create(
    @Body() createPuzzleDto: CreatePuzzleDto,
  ): Promise<PuzzleWithStats> {
    const userId = 'temp-user-id'; // TODO: Get from auth
    this.logger.log(`Creating puzzle: ${createPuzzleDto.title} by user: ${userId}`);
    return await this.puzzlesService.create(createPuzzleDto, userId);
  }

  @Get()
  async findAll(@Query() searchDto: SearchPuzzleDto): Promise<SearchResult> {
    this.logger.log(`Searching puzzles with filters: ${JSON.stringify(searchDto)}`);
    return await this.puzzlesService.findAll(searchDto);
  }

  @Get('analytics')
  async getAnalytics(@Query('period') period?: string): Promise<PuzzleAnalytics> {
    return await this.puzzlesService.getAnalytics(period);
  }

  @Patch('bulk')
  async bulkUpdate(
    @Body('puzzleIds', new ParseArrayPipe({ items: String })) puzzleIds: string[],
    @Body('bulkUpdate') bulkUpdateDto: BulkUpdateDto,
  ) {
    const userId = 'temp-user-id'; // TODO: Get from auth
    this.logger.log(`Bulk updating ${puzzleIds.length} puzzles with action: ${bulkUpdateDto.action}`);
    return await this.puzzlesService.bulkUpdate(puzzleIds, bulkUpdateDto, userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PuzzleWithStats> {
    return await this.puzzlesService.findOne(id);
  }

  @Get(':id/stats')
  async getPuzzleStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() statsDto: PuzzleStatsDto,
  ) {
    const puzzle = await this.puzzlesService.findOne(id);
    return {
      puzzle,
      stats: {
        period: statsDto.period,
        includeStats: statsDto.includeStats,
      },
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePuzzleDto: UpdatePuzzleDto,
  ): Promise<PuzzleWithStats> {
    const userId = 'temp-user-id'; // TODO: Get from auth
    this.logger.log(`Updating puzzle: ${id} by user: ${userId}`);
    return await this.puzzlesService.update(id, updatePuzzleDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const userId = 'temp-user-id'; // TODO: Get from auth
    this.logger.log(`Deleting puzzle: ${id} by user: ${userId}`);
    await this.puzzlesService.remove(id, userId);
  }

  @Post(':id/publish')
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PuzzleWithStats> {
    const userId = 'temp-user-id'; // TODO: Get from auth
    this.logger.log(`Publishing puzzle: ${id} by user: ${userId}`);
    return await this.puzzlesService.update(id, { isPublished: true }, userId);
  }

  @Post(':id/unpublish')
  async unpublish(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PuzzleWithStats> {
    const userId = 'temp-user-id'; // TODO: Get from auth
    this.logger.log(`Unpublishing puzzle: ${id} by user: ${userId}`);
    return await this.puzzlesService.update(id, { isPublished: false }, userId);
  }

  @Post(':id/duplicate')
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PuzzleWithStats> {
    const userId = 'temp-user-id'; // TODO: Get from auth
    this.logger.log(`Duplicating puzzle: ${id} by user: ${userId}`);

    const originalPuzzle = await this.puzzlesService.findOne(id);

    const duplicateDto: CreatePuzzleDto = {
      title: `${originalPuzzle.title} (Copy)`,
      description: originalPuzzle.description,
      category: originalPuzzle.category,
      difficulty: originalPuzzle.difficulty as any,
      difficultyRating: originalPuzzle.difficultyRating,
      basePoints: originalPuzzle.basePoints,
      timeLimit: originalPuzzle.timeLimit,
      maxHints: originalPuzzle.maxHints,
      content: originalPuzzle.content as any,
      hints: originalPuzzle.hints,
      tags: originalPuzzle.tags,
      scoring: originalPuzzle.scoring,
      isFeatured: false,
    };

    return await this.puzzlesService.create(duplicateDto, userId);
  }

  // ──────────────────────────────────────────────────────────────────
  // Solution Submission & Verification
  // ──────────────────────────────────────────────────────────────────

  /**
   * Submit and verify a puzzle solution.
   * Rate-limited to 5 submissions per minute per user.
   */
  @Post(':id/submit')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async submitSolution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitSolutionDto,
    @Req() req: any,
  ): Promise<SubmissionResultDto> {
    const userId = req.user?.id ?? 'temp-user-id'; // TODO: Get from auth guard
    const ipAddress: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for']?.split(',')[0]?.trim();
    this.logger.log(`Solution submission: puzzle=${id} user=${userId}`);
    return this.submissionService.submitSolution(userId, id, dto, ipAddress);
  }

  /**
   * Get a user's submission history for a specific puzzle.
   */
  @Get(':id/submissions')
  async getPuzzleSubmissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Req() req: any,
  ): Promise<SubmissionHistoryDto> {
    const userId = req.user?.id ?? 'temp-user-id';
    return this.submissionService.getSubmissionHistory(userId, id, page, limit);
  }

  /**
   * Get all submission history for the authenticated user across all puzzles.
   */
  @Get('submissions/history')
  async getAllSubmissions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Req() req: any,
  ): Promise<SubmissionHistoryDto> {
    const userId = req.user?.id ?? 'temp-user-id';
    return this.submissionService.getSubmissionHistory(userId, undefined, page, limit);
  }
}
