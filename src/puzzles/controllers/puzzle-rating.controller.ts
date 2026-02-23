import { Controller, Post, Body, Param, UseGuards, Request, Get } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PuzzleRatingService } from '../services/puzzle-rating.service';
import { CreateRatingDto } from '../dto/create-rating.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PuzzleRating } from '../entities/puzzle-rating.entity';
import { PuzzleRatingAggregate } from '../entities/puzzle-rating-aggregate.entity';

@Controller('api/puzzles')
export class PuzzleRatingController {
  constructor(private readonly ratingService: PuzzleRatingService) {}

  @Post(':id/ratings')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async submitRating(
    @Param('id') puzzleId: string,
    @Body() createRatingDto: CreateRatingDto,
    @Request() req,
  ): Promise<PuzzleRating> {
    return this.ratingService.submitRating(req.user.id, puzzleId, createRatingDto);
  }

  @Get(':id/ratings/aggregate')
  async getAggregate(@Param('id') puzzleId: string): Promise<PuzzleRatingAggregate> {
    return this.ratingService.getPuzzleAggregate(puzzleId);
  }
}
