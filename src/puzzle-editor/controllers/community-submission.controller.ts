/**
 * Community Submission Controller
 * Handles community puzzle submission endpoints
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommunitySubmissionService } from '../services/community-submission.service';
import {
  SubmitToCommunityDto,
  ReviewSubmissionDto,
  ApproveSubmissionDto,
  RejectSubmissionDto,
} from '../dto';

@ApiTags('Community Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('community-submissions')
export class CommunitySubmissionController {
  constructor(private submissionService: CommunitySubmissionService) {}

  /**
   * Submit puzzle to community
   */
  @Post(':editorId/submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit puzzle to community' })
  @ApiResponse({ status: 201, description: 'Puzzle submitted' })
  async submitPuzzle(
    @Param('editorId') editorId: string,
    @Body() dto: SubmitToCommunityDto,
    @Request() req: any,
  ) {
    return this.submissionService.submitPuzzle(editorId, dto, req.user.id);
  }

  /**
   * Get submission by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get submission details' })
  @ApiResponse({ status: 200, description: 'Submission details' })
  async getSubmission(@Param('id') id: string) {
    return this.submissionService.getSubmission(id);
  }

  /**
   * Search submissions
   */
  @Get()
  @ApiOperation({ summary: 'Search community submissions' })
  @ApiResponse({ status: 200, description: 'Submissions list' })
  async searchSubmissions(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const tagArray = tags ? tags.split(',') : undefined;
    return this.submissionService.searchSubmissions({
      status,
      category,
      tags: tagArray,
      search,
      sortBy,
      page,
      limit,
    });
  }

  /**
   * Get moderation queue
   */
  @Get('/moderation/queue')
  @ApiOperation({ summary: 'Get moderation queue' })
  @ApiResponse({ status: 200, description: 'Moderation queue' })
  async getModerationQueue(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Check if user is moderator/admin
    if (!req.user.roles?.includes('MODERATOR') && !req.user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Only moderators can access the moderation queue');
    }

    return this.submissionService.getModerationQueue({
      status,
      page,
      limit,
    });
  }

  /**
   * Review submission
   */
  @Post(':id/review')
  @ApiOperation({ summary: 'Submit a review for submission' })
  @ApiResponse({ status: 201, description: 'Review submitted' })
  async reviewSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewSubmissionDto,
    @Request() req: any,
  ) {
    const reviewerRole = req.user.roles?.includes('ADMIN')
      ? 'ADMIN'
      : req.user.roles?.includes('MODERATOR')
      ? 'MODERATOR'
      : 'COMMUNITY_MEMBER';

    return this.submissionService.reviewSubmission(id, dto, req.user.id, reviewerRole);
  }

  /**
   * Approve submission
   */
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a submission' })
  @ApiResponse({ status: 200, description: 'Submission approved' })
  async approveSubmission(
    @Param('id') id: string,
    @Body() dto: ApproveSubmissionDto,
    @Request() req: any,
  ) {
    // Check if user is moderator/admin
    if (!req.user.roles?.includes('MODERATOR') && !req.user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Only moderators can approve submissions');
    }

    return this.submissionService.approveSubmission(id, dto, req.user.id);
  }

  /**
   * Reject submission
   */
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a submission' })
  @ApiResponse({ status: 200, description: 'Submission rejected' })
  async rejectSubmission(
    @Param('id') id: string,
    @Body() dto: RejectSubmissionDto,
    @Request() req: any,
  ) {
    // Check if user is moderator/admin
    if (!req.user.roles?.includes('MODERATOR') && !req.user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Only moderators can reject submissions');
    }

    return this.submissionService.rejectSubmission(id, dto, req.user.id);
  }

  /**
   * Feature submission
   */
  @Post(':id/feature')
  @ApiOperation({ summary: 'Feature a submission' })
  @ApiResponse({ status: 200, description: 'Submission featured' })
  async featureSubmission(@Param('id') id: string, @Request() req: any) {
    // Check if user is admin
    if (!req.user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Only admins can feature submissions');
    }

    return this.submissionService.featureSubmission(id, req.user.id);
  }

  /**
   * Upvote submission
   */
  @Post(':id/upvote')
  @ApiOperation({ summary: 'Upvote a submission' })
  @ApiResponse({ status: 200, description: 'Submission upvoted' })
  async upvoteSubmission(@Param('id') id: string, @Request() req: any) {
    return this.submissionService.upvoteSubmission(id, req.user.id);
  }

  /**
   * Downvote submission
   */
  @Post(':id/downvote')
  @ApiOperation({ summary: 'Downvote a submission' })
  @ApiResponse({ status: 200, description: 'Submission downvoted' })
  async downvoteSubmission(@Param('id') id: string, @Request() req: any) {
    return this.submissionService.downvoteSubmission(id, req.user.id);
  }

  /**
   * Get community statistics
   */
  @Get('/statistics/overview')
  @ApiOperation({ summary: 'Get community statistics' })
  @ApiResponse({ status: 200, description: 'Community stats' })
  async getCommunityStats() {
    return this.submissionService.getCommunityStats();
  }
}
