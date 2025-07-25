import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { CreateLeaderboardEntryDto } from './dto/create-leaderboard-entry.dto';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post()
  createLeaderboard(@Body() dto: CreateLeaderboardDto) {
    return this.leaderboardService.createLeaderboard(dto);
  }

  @Post('entry')
  createEntry(@Body() dto: CreateLeaderboardEntryDto) {
    return this.leaderboardService.createEntry(dto);
  }

  @Post(':id/archive')
  async archiveAndResetLeaderboard(@Param('id') id: number) {
    await this.leaderboardService.archiveAndResetLeaderboard(Number(id));
    return { message: 'Leaderboard archived and reset.' };
  }

  @Get()
  getLeaderboardsByCategoryAndPeriod(
    @Query('category') category: string,
    @Query('period') period: string,
  ) {
    return this.leaderboardService.getLeaderboardsByCategoryAndPeriod(category, period);
  }

  @Get(':id')
  getLeaderboard(
    @Param('id') id: number,
    @Query('ranking') ranking: 'score' | 'timeTaken' | 'efficiency' = 'score',
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    @Query('period') period?: string,
    @Query('userId') userId?: number,
  ) {
    return this.leaderboardService.getLeaderboardWithEntries(Number(id), ranking, order, period, userId ? Number(userId) : undefined);
  }
} 