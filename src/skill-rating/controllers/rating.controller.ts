import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { SkillRatingService } from '../skill-rating.service';
import { PlayerRating } from '../entities/player-rating.entity';
import { PlayerRatingDetails } from '../skill-rating.service';

/**
 * GET /players/me/rating   — authenticated player's rating, tier, and percentile
 * GET /players/:id/rating  — another player's rating (respects privacy settings)
 */
@Controller('players')
export class PlayerRatingController {
  private readonly logger = new Logger(PlayerRatingController.name);

  constructor(private readonly skillRatingService: SkillRatingService) {}

  @Get('me/rating')
  async getMyRating(
    @Query('userId') userId: string,
  ): Promise<PlayerRatingDetails> {
    return this.skillRatingService.getPlayerRatingWithDetails(userId);
  }

  @Get(':id/rating')
  async getPlayerRating(
    @Param('id') targetUserId: string,
    @Query('requestingUserId') requestingUserId?: string,
  ): Promise<PlayerRatingDetails> {
    return this.skillRatingService.getPublicPlayerRating(targetUserId, requestingUserId);
  }
}

/**
 * GET /ratings/leaderboard — top 100 players by skill rating,
 * kept separate from the score-based leaderboard.
 */
@Controller('ratings')
export class RatingsController {
  constructor(private readonly skillRatingService: SkillRatingService) {}

  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit') limit = '100',
    @Query('offset') offset = '0',
  ): Promise<PlayerRating[]> {
    return this.skillRatingService.getLeaderboard(
      parseInt(limit, 10),
      parseInt(offset, 10),
    );
  }
}
