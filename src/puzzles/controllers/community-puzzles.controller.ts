import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UserPuzzleSubmissionService } from '../services/user-puzzle-submission.service';
import { CommunityPuzzlesService } from '../services/community-puzzles.service';
import { FeaturedPuzzlesService } from '../services/featured-puzzles.service';
import { CreatorRewardsService } from '../services/creator-rewards.service';
import { PuzzleModerationService } from '../services/puzzle-moderation.service';
import {
  CreatePuzzleSubmissionDto,
  UpdatePuzzleSubmissionDto,
  SubmitForReviewDto,
} from '../dto/user-puzzle-submission.dto';
import {
  SearchPuzzlesDto,
  CreatePuzzleRatingDto,
  CreatePuzzleCommentDto,
  PuzzleCommentVoteDto,
  SharePuzzleDto,
  ReportPuzzleDto,
} from '../dto/community-puzzles.dto';

@Controller('community-puzzles')
@UseGuards(JwtAuthGuard)
export class CommunityPuzzlesController {
  constructor(
    private readonly submissionService: UserPuzzleSubmissionService,
    private readonly communityService: CommunityPuzzlesService,
    private readonly featuredService: FeaturedPuzzlesService,
    private readonly rewardsService: CreatorRewardsService,
    private readonly moderationService: PuzzleModerationService,
  ) {}

  // User Puzzle Submission Endpoints
  @Post('submissions')
  async createSubmission(
    @Request() req,
    @Body() createDto: CreatePuzzleSubmissionDto,
  ) {
    const submission = await this.submissionService.createSubmission(
      req.user.id,
      createDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Puzzle submission created successfully',
      data: submission,
    };
  }

  @Get('submissions')
  async getUserSubmissions(
    @Request() req,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.submissionService.getUserSubmissions(
      req.user.id,
      status as any,
      page,
      limit,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'User submissions retrieved successfully',
      data: result,
    };
  }

  @Get('submissions/:id')
  async getSubmission(
    @Request() req,
    @Param('id') id: string,
  ) {
    const submission = await this.submissionService.getSubmissionById(id, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Submission retrieved successfully',
      data: submission,
    };
  }

  @Put('submissions/:id')
  async updateSubmission(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdatePuzzleSubmissionDto,
  ) {
    const submission = await this.submissionService.updateSubmission(
      id,
      req.user.id,
      updateDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Submission updated successfully',
      data: submission,
    };
  }

  @Delete('submissions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubmission(@Request() req, @Param('id') id: string) {
    await this.submissionService.deleteSubmission(id, req.user.id);
  }

  @Post('submissions/:id/submit-review')
  async submitForReview(
    @Request() req,
    @Param('id') id: string,
    @Body() reviewData?: SubmitForReviewDto,
  ) {
    const submission = await this.submissionService.submitForReview(
      id,
      req.user.id,
      reviewData,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle submitted for review',
      data: submission,
    };
  }

  @Post('submissions/:id/publish')
  async publishPuzzle(@Request() req, @Param('id') id: string) {
    const submission = await this.submissionService.publishPuzzle(id, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle published successfully',
      data: submission,
    };
  }

  // Community Discovery Endpoints
  @Get('discover')
  async searchPuzzles(@Query() searchDto: SearchPuzzlesDto) {
    const result = await this.submissionService.searchCommunityPuzzles(searchDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzles retrieved successfully',
      data: result,
    };
  }

  @Get('featured')
  async getFeaturedPuzzles(@Query('limit') limit?: number) {
    const puzzles = await this.featuredService.getFeaturedPuzzles(limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Featured puzzles retrieved successfully',
      data: puzzles,
    };
  }

  @Get('trending')
  async getTrendingPuzzles(@Query('limit') limit?: number) {
    const puzzles = await this.submissionService.getTrendingPuzzles(limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Trending puzzles retrieved successfully',
      data: puzzles,
    };
  }

  @Get('recommended')
  async getRecommendedPuzzles(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    const puzzles = await this.submissionService.getRecommendedPuzzles(
      req.user.id,
      limit,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Recommended puzzles retrieved successfully',
      data: puzzles,
    };
  }

  @Get('shared/:shareableLink')
  async getPuzzleByShareableLink(@Param('shareableLink') shareableLink: string) {
    const puzzle = await this.submissionService.getSubmissionByShareableLink(
      shareableLink,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle retrieved successfully',
      data: puzzle,
    };
  }

  // Rating and Review Endpoints
  @Post(':id/rate')
  async ratePuzzle(
    @Request() req,
    @Param('id') id: string,
    @Body() ratingDto: CreatePuzzleRatingDto,
  ) {
    const rating = await this.communityService.ratePuzzle(id, req.user.id, ratingDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Puzzle rated successfully',
      data: rating,
    };
  }

  @Get(':id/ratings')
  async getPuzzleRatings(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.communityService.getPuzzleRatings(id, page, limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle ratings retrieved successfully',
      data: result,
    };
  }

  @Get(':id/my-rating')
  async getUserRating(@Request() req, @Param('id') id: string) {
    const rating = await this.communityService.getUserRating(id, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User rating retrieved successfully',
      data: rating,
    };
  }

  // Comment Endpoints
  @Post(':id/comments')
  async createComment(
    @Request() req,
    @Param('id') id: string,
    @Body() commentDto: CreatePuzzleCommentDto,
  ) {
    const comment = await this.communityService.createComment(
      id,
      req.user.id,
      commentDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Comment created successfully',
      data: comment,
    };
  }

  @Get(':id/comments')
  async getPuzzleComments(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.communityService.getPuzzleComments(id, page, limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle comments retrieved successfully',
      data: result,
    };
  }

  @Put('comments/:id')
  async updateComment(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: any,
  ) {
    const comment = await this.communityService.updateComment(
      id,
      req.user.id,
      updateDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Comment updated successfully',
      data: comment,
    };
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(@Request() req, @Param('id') id: string) {
    await this.communityService.deleteComment(id, req.user.id);
  }

  @Post('comments/:id/vote')
  async voteOnComment(
    @Request() req,
    @Param('id') id: string,
    @Body() voteDto: PuzzleCommentVoteDto,
  ) {
    const comment = await this.communityService.voteOnComment(id, req.user.id, voteDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Vote recorded successfully',
      data: comment,
    };
  }

  // Sharing Endpoints
  @Post(':id/share')
  async sharePuzzle(
    @Request() req,
    @Param('id') id: string,
    @Body() shareDto: SharePuzzleDto,
  ) {
    const result = await this.communityService.sharePuzzle(id, req.user.id, shareDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle shared successfully',
      data: result,
    };
  }

  @Get(':id/share-stats')
  async getShareStats(@Param('id') id: string) {
    const stats = await this.communityService.getShareStats(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Share statistics retrieved successfully',
      data: stats,
    };
  }

  // Reporting Endpoints
  @Post(':id/report')
  async reportPuzzle(
    @Request() req,
    @Param('id') id: string,
    @Body() reportDto: ReportPuzzleDto,
  ) {
    await this.communityService.reportPuzzle(
      id,
      req.user.id,
      reportDto.reason,
      reportDto.category,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle reported successfully',
    };
  }

  @Post('comments/:id/report')
  async reportComment(
    @Request() req,
    @Param('id') id: string,
    @Body() reportData: any,
  ) {
    await this.communityService.reportComment(id, req.user.id, reportData.reason);
    return {
      statusCode: HttpStatus.OK,
      message: 'Comment reported successfully',
    };
  }

  // Creator Stats and Leaderboard Endpoints
  @Get('creator-stats')
  async getCreatorStats(@Request() req) {
    const stats = await this.submissionService.getCreatorStats(req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Creator statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit') limit?: number,
    @Query('timeframe') timeframe?: string,
  ) {
    const leaderboard = await this.rewardsService.getLeaderboard(
      limit,
      timeframe as any,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Leaderboard retrieved successfully',
      data: leaderboard,
    };
  }

  @Get('top-creators')
  async getTopCreators(@Query('limit') limit?: number) {
    const creators = await this.communityService.getTopCreators(limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Top creators retrieved successfully',
      data: creators,
    };
  }

  @Get('my-rewards')
  async getMyRewards(@Request() req) {
    const stats = await this.rewardsService.getCreatorStats(req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Creator rewards retrieved successfully',
      data: stats,
    };
  }

  // Play Tracking
  @Post(':id/play')
  async trackPlay(@Request() req, @Param('id') id: string) {
    await this.submissionService.incrementPlayCount(id);
    await this.rewardsService.onPuzzlePlayed(id, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Play tracked successfully',
    };
  }

  // Admin/Moderator Endpoints (would require admin guard)
  @Get('admin/moderation-queue')
  async getModerationQueue(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.moderationService.getModerationQueue(
      status as any,
      page,
      limit,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Moderation queue retrieved successfully',
      data: result,
    };
  }

  @Post('admin/:id/moderate')
  async moderatePuzzle(
    @Request() req,
    @Param('id') id: string,
    @Body() decisionDto: any,
  ) {
    const submission = await this.moderationService.moderatePuzzle(
      id,
      req.user.id,
      decisionDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle moderated successfully',
      data: submission,
    };
  }

  @Post('admin/:id/feature')
  async featurePuzzle(@Request() req, @Param('id') id: string) {
    const puzzle = await this.featuredService.manuallyFeaturePuzzle(id, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle featured successfully',
      data: puzzle,
    };
  }

  @Post('admin/:id/unfeature')
  async unfeaturePuzzle(@Request() req, @Param('id') id: string) {
    const puzzle = await this.featuredService.unfeaturePuzzle(id, req.user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Puzzle unfeatured successfully',
      data: puzzle,
    };
  }

  @Get('admin/featured-stats')
  async getFeaturedStats() {
    const stats = await this.featuredService.getFeaturedPuzzleStats();
    return {
      statusCode: HttpStatus.OK,
      message: 'Featured puzzle statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('admin/moderation-stats')
  async getModerationStats(@Query('timeframe') timeframe?: string) {
    const stats = await this.moderationService.getModerationStats(timeframe as any);
    return {
      statusCode: HttpStatus.OK,
      message: 'Moderation statistics retrieved successfully',
      data: stats,
    };
  }
}
