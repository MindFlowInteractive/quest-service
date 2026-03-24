import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { QueryHistoryDto } from './dto/query-history.dto';
import { TrackProgressDto } from './dto/track-progress.dto';
import { AchievementService } from './achievement.service';

@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Post()
  createDefinition(@Body() dto: CreateAchievementDto) {
    return this.achievementService.createDefinition(dto);
  }

  @Post('seed-defaults')
  seedDefaults() {
    return this.achievementService.seedDefaultDefinitions();
  }

  @Get()
  listDefinitions() {
    return this.achievementService.listDefinitions();
  }

  @Post('progress')
  trackProgress(@Body() dto: TrackProgressDto) {
    return this.achievementService.trackProgress(dto);
  }

  @Get('users/:userId/progress')
  getUserProgress(@Param('userId') userId: string) {
    return this.achievementService.getUserProgress(userId);
  }

  @Get('users/:userId/history')
  getUserHistory(
    @Param('userId') userId: string,
    @Query() query: QueryHistoryDto,
  ) {
    return this.achievementService.getUserHistory(userId, query);
  }

  @Get('users/:userId/badges')
  getUserBadges(@Param('userId') userId: string) {
    return this.achievementService.getUserBadges(userId);
  }

  @Get(':id')
  getDefinition(@Param('id') id: string) {
    return this.achievementService.getDefinition(id);
  }
}
