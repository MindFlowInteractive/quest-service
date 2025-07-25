import { Controller, Post, Body, Get, Param } from '@nestjs/common';
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

  @Get(':id')
  getLeaderboard(@Param('id') id: number) {
    return this.leaderboardService.getLeaderboardWithEntries(Number(id));
  }
} 