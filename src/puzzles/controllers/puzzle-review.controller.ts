import { Controller, Post, Put, Delete, Body, Param, UseGuards, Request, Get, Query } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PuzzleReviewService } from '../services/puzzle-review.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { VoteReviewDto } from '../dto/vote-review.dto';
import { FlagReviewDto } from '../dto/flag-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PuzzleReview } from '../entities/puzzle-review.entity';

@Controller('api')
export class PuzzleReviewController {
  constructor(private readonly reviewService: PuzzleReviewService) {}

  @Post('puzzles/:id/reviews')
  @UseGuards(JwtAuthGuard)
  async submitReview(
    @Param('id') puzzleId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req,
  ): Promise<PuzzleReview> {
    return this.reviewService.submitReview(req.user.id, puzzleId, createReviewDto);
  }

  @Put('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('id') reviewId: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ): Promise<PuzzleReview> {
    return this.reviewService.updateReview(req.user.id, reviewId, updateReviewDto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('id') reviewId: string, @Request() req): Promise<void> {
    return this.reviewService.deleteReview(req.user.id, reviewId);
  }

  @Post('reviews/:id/vote')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async voteReview(
    @Param('id') reviewId: string,
    @Body() voteDto: VoteReviewDto,
    @Request() req,
  ): Promise<void> {
    return this.reviewService.voteReview(req.user.id, reviewId, voteDto);
  }

  @Post('reviews/:id/flag')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  async flagReview(
    @Param('id') reviewId: string,
    @Body() flagDto: FlagReviewDto,
    @Request() req,
  ): Promise<void> {
    return this.reviewService.flagReview(req.user.id, reviewId, flagDto);
  }

  @Get('puzzles/:id/reviews')
  async getReviews(
    @Param('id') puzzleId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('sort') sort: 'recency' | 'helpful' = 'recency',
  ): Promise<{ reviews: PuzzleReview[], total: number }> {
    return this.reviewService.getPuzzleReviews(puzzleId, page, limit, sort);
  }
}
