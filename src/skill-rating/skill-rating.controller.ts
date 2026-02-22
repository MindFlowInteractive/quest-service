import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { SkillRatingService } from './skill-rating.service';
import { PlayerRating } from './entities/player-rating.entity';
import { RatingHistory } from './entities/rating-history.entity';
import { Season } from './entities/season.entity';
import { PuzzleCompletionData } from './elo.service';

@Controller('skill-rating')
export class SkillRatingController {
  private readonly logger = new Logger(SkillRatingController.name);

  constructor(private readonly skillRatingService: SkillRatingService) {}

  /**
   * Get player's current rating
   */
  @Get('player/:userId')
  async getPlayerRating(@Param('userId') userId: string): Promise<PlayerRating> {
    return this.skillRatingService.getPlayerRating(userId);
  }

  /**
   * Update rating based on puzzle completion
   */
  @Post('puzzle-completion')
  async updateRatingOnPuzzleCompletion(
    @Body() completionData: PuzzleCompletionData,
  ): Promise<PlayerRating> {
    return this.skillRatingService.updateRatingOnPuzzleCompletion(completionData);
  }

  /**
   * Get player's rating history
   */
  @Get('history/:userId')
  async getRatingHistory(
    @Param('userId') userId: string,
    @Query('limit') limit: string = '50',
  ): Promise<RatingHistory[]> {
    return this.skillRatingService.getRatingHistory(userId, parseInt(limit, 10));
  }

  /**
   * Get leaderboard
   */
  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit') limit: string = '100',
    @Query('offset') offset: string = '0',
  ): Promise<PlayerRating[]> {
    return this.skillRatingService.getLeaderboard(
      parseInt(limit, 10),
      parseInt(offset, 10),
    );
  }

  /**
   * Get player's rank
   */
  @Get('rank/:userId')
  async getPlayerRank(@Param('userId') userId: string): Promise<{ rank: number }> {
    const rank = await this.skillRatingService.getPlayerRank(userId);
    return { rank };
  }

  /**
   * Get current season
   */
  @Get('season/current')
  async getCurrentSeason(): Promise<Season> {
    return this.skillRatingService.getCurrentSeason();
  }

  /**
   * Get all seasons
   */
  @Get('seasons')
  async getAllSeasons(): Promise<Season[]> {
    return this.skillRatingService.getAllSeasons();
  }

  /**
   * End a season (admin only)
   */
  @Post('season/:seasonId/end')
  async endSeason(@Param('seasonId') seasonId: string): Promise<{ message: string }> {
    await this.skillRatingService.endSeason(seasonId);
    return { message: `Season ${seasonId} ended successfully` };
  }
}
