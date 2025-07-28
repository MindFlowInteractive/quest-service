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
  Logger
} from '@nestjs/common';
import { PuzzlesService, PuzzleWithStats, SearchResult, PuzzleAnalytics } from './puzzles.service';
import {
  CreatePuzzleDto,
  UpdatePuzzleDto,
  SearchPuzzleDto,
  BulkUpdateDto,
  PuzzleStatsDto
} from './dto';

@Controller('puzzles')
@UseInterceptors(ClassSerializerInterceptor)
export class PuzzlesController {
  private readonly logger = new Logger(PuzzlesController.name);

  constructor(private readonly puzzlesService: PuzzlesService) {}

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
}
