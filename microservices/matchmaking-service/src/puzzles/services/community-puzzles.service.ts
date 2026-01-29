import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPuzzleSubmission, PuzzleSubmissionStatus } from '../entities/user-puzzle-submission.entity';
import { PuzzleRating } from '../entities/puzzle-rating.entity';
import { PuzzleComment, PuzzleCommentStatus } from '../entities/puzzle-comment.entity';
import { CreatePuzzleRatingDto, CreatePuzzleCommentDto, PuzzleCommentVoteDto, SharePuzzleDto } from '../dto/community-puzzles.dto';

@Injectable()
export class CommunityPuzzlesService {
  private readonly logger = new Logger(CommunityPuzzlesService.name);

  constructor(
    @InjectRepository(UserPuzzleSubmission)
    private readonly submissionRepository: Repository<UserPuzzleSubmission>,
    @InjectRepository(PuzzleRating)
    private readonly ratingRepository: Repository<PuzzleRating>,
    @InjectRepository(PuzzleComment)
    private readonly commentRepository: Repository<PuzzleComment>,
  ) {}

  // Rating System
  async ratePuzzle(
    submissionId: string,
    userId: string,
    ratingDto: CreatePuzzleRatingDto,
  ): Promise<PuzzleRating> {
    // Check if puzzle exists and allows ratings
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, status: PuzzleSubmissionStatus.PUBLISHED, allowRatings: true },
    });

    if (!submission) {
      throw new Error('Puzzle not found or ratings not allowed');
    }

    // Check if user already rated
    const existingRating = await this.ratingRepository.findOne({
      where: { puzzleId: submissionId, userId },
    });

    if (existingRating) {
      // Update existing rating
      Object.assign(existingRating, ratingDto);
      existingRating.lastEditedAt = new Date();
      const updatedRating = await this.ratingRepository.save(existingRating);
      await this.updatePuzzleRatingStats(submissionId);
      return updatedRating;
    } else {
      // Create new rating
      const newRating = new PuzzleRating();
      newRating.submissionId = submissionId;
      newRating.userId = userId;
      newRating.rating = ratingDto.rating;
      newRating.review = ratingDto.review;
      newRating.metadata = ratingDto.metadata || {} as any;
      newRating.isPublic = true;
      newRating.isReported = false;
      newRating.tags = [];
      
      const savedRating = await this.ratingRepository.save(newRating);
      await this.updatePuzzleRatingStats(submissionId);
      return savedRating;
    }
  }

  async getUserRating(submissionId: string, userId: string): Promise<PuzzleRating | null> {
    return await this.ratingRepository.findOne({
      where: { submissionId, userId },
    });
  }

  async getPuzzleRatings(
    submissionId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    ratings: PuzzleRating[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [ratings, total] = await this.ratingRepository.findAndCount({
      where: { submissionId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return {
      ratings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async updatePuzzleRatingStats(submissionId: string): Promise<void> {
    const ratings = await this.ratingRepository.find({
      where: { submissionId },
    });

    if (ratings.length === 0) return;

    const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
    
    await this.submissionRepository.update(submissionId, {
      averageRating,
      ratingCount: ratings.length,
    });
  }

  // Comment System
  async createComment(
    submissionId: string,
    userId: string,
    commentDto: CreatePuzzleCommentDto,
  ): Promise<PuzzleComment> {
    // Check if puzzle exists and allows comments
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, status: PuzzleSubmissionStatus.PUBLISHED, allowComments: true },
    });

    if (!submission) {
      throw new Error('Puzzle not found or comments not allowed');
    }

    // Check if it's a reply
    let isFromCreator = false;
    if (commentDto.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: commentDto.parentId, submissionId },
      });
      
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
      
      // Increment parent reply count
      await this.commentRepository.increment({ id: commentDto.parentId }, 'replyCount', 1);
    } else {
      // Check if commenter is the puzzle creator
      isFromCreator = submission.userId === userId;
    }

    const comment = this.commentRepository.create({
      submissionId,
      userId,
      ...commentDto,
      isFromCreator,
      status: PuzzleCommentStatus.ACTIVE,
    });

    const savedComment = await this.commentRepository.save(comment);
    
    // Update last activity on puzzle
    await this.submissionRepository.update(submissionId, {
      lastActivityAt: new Date(),
    });

    return savedComment;
  }

  async updateComment(
    commentId: string,
    userId: string,
    updateDto: any,
  ): Promise<PuzzleComment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, userId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.status !== PuzzleCommentStatus.ACTIVE) {
      throw new Error('Cannot edit non-active comments');
    }

    Object.assign(comment, updateDto);
    comment.metadata = {
      ...comment.metadata,
      editedAt: new Date(),
      editCount: (comment.metadata.editCount || 0) + 1,
    };

    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, userId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.status = PuzzleCommentStatus.DELETED;
    await this.commentRepository.save(comment);

    // Update parent reply count if it's a reply
    if (comment.parentId) {
      await this.commentRepository.decrement({ id: comment.parentId }, 'replyCount', 1);
    }
  }

  async voteOnComment(
    commentId: string,
    userId: string,
    voteDto: PuzzleCommentVoteDto,
  ): Promise<PuzzleComment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, status: PuzzleCommentStatus.ACTIVE },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // In a real implementation, you'd track votes in a separate table
    // For simplicity, we'll just increment counters
    if (voteDto.voteType === 'upvote') {
      await this.commentRepository.increment({ id: commentId }, 'upvotes', 1);
    } else {
      await this.commentRepository.increment({ id: commentId }, 'downvotes', 1);
    }

    return await this.commentRepository.findOne({ where: { id: commentId } });
  }

  async getPuzzleComments(
    submissionId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    comments: PuzzleComment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: { 
        submissionId, 
        status: PuzzleCommentStatus.ACTIVE,
        parentId: null, // Only top-level comments
      },
      order: {
        isPinned: 'DESC',
        upvotes: 'DESC',
        createdAt: 'DESC',
      },
      relations: ['user', 'replies'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Sharing System
  async sharePuzzle(
    submissionId: string,
    userId: string,
    shareDto: SharePuzzleDto,
  ): Promise<{
    shareUrl: string;
    embedCode?: string;
    socialUrls: Record<string, string>;
  }> {
    const submission = await this.submissionRepository.findOne({
      where: { 
        id: submissionId, 
        status: PuzzleSubmissionStatus.PUBLISHED,
        isPublic: true,
      },
    });

    if (!submission) {
      throw new Error('Puzzle not found or not shareable');
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://quest-game.com';
    const puzzleUrl = `${baseUrl}/puzzles/${submissionId}`;
    const shareableLink = submission.sharingSettings?.shareableLink 
      ? `${baseUrl}/shared/${submission.sharingSettings.shareableLink}`
      : puzzleUrl;

    const result: any = {
      shareUrl: shareableLink,
      socialUrls: {},
    };

    // Generate social media URLs
    if (shareDto.shareType === 'social' || !shareDto.shareType) {
      const encodedUrl = encodeURIComponent(shareableLink);
      const encodedTitle = encodeURIComponent(submission.title);
      const encodedMessage = encodeURIComponent(shareDto.customMessage || `Check out this puzzle: ${submission.title}`);

      result.socialUrls = {
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
        discord: encodedUrl, // Discord doesn't have a direct share URL
        whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
      };
    }

    // Generate embed code if allowed
    if (submission.sharingSettings?.embeddable && shareDto.shareType === 'embed') {
      result.embedCode = `<iframe src="${baseUrl}/embed/puzzle/${submissionId}" width="800" height="600" frameborder="0"></iframe>`;
    }

    // Track share analytics
    await this.trackShare(submissionId, userId, shareDto);

    return result;
  }

  private async trackShare(submissionId: string, userId: string, shareDto: SharePuzzleDto): Promise<void> {
    // In a real implementation, you'd store share analytics
    this.logger.log(`Puzzle ${submissionId} shared by user ${userId} via ${shareDto.shareType}`);
  }

  async getShareStats(submissionId: string): Promise<{
    totalShares: number;
    sharesByPlatform: Record<string, number>;
    recentShares: Array<{
      platform: string;
      sharedAt: Date;
      userId: string;
    }>;
  }> {
    // Mock implementation - in reality, you'd query a shares tracking table
    return {
      totalShares: 0,
      sharesByPlatform: {},
      recentShares: [],
    };
  }

  // Community Features
  async getTopCreators(limit: number = 10): Promise<Array<{
    userId: string;
    username: string;
    totalPuzzles: number;
    averageRating: number;
    totalPlays: number;
    followers: number;
  }>> {
    const query = this.submissionRepository
      .createQueryBuilder('submission')
      .select([
        'submission.userId',
        'COUNT(submission.id) as totalPuzzles',
        'AVG(submission.averageRating) as averageRating',
        'SUM(submission.playCount) as totalPlays',
      ])
      .where('submission.status = :status', { status: PuzzleSubmissionStatus.PUBLISHED })
      .andWhere('submission.isPublic = :isPublic', { isPublic: true })
      .groupBy('submission.userId')
      .orderBy('totalPlays', 'DESC')
      .limit(limit);

    const results = await query.getRawMany();

    return results.map((result: any, index) => ({
      userId: result.submission_userId,
      username: `user_${result.submission_userId}`, // Would join with users table
      totalPuzzles: parseInt(result.totalPuzzles),
      averageRating: parseFloat(result.averageRating) || 0,
      totalPlays: parseInt(result.totalPlays) || 0,
      followers: 0, // Would come from a followers table
    }));
  }

  async reportPuzzle(
    submissionId: string,
    userId: string,
    reason: string,
    category?: string,
  ): Promise<void> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new Error('Puzzle not found');
    }

    // Add to moderation queue
    if (submission.status === PuzzleSubmissionStatus.PUBLISHED) {
      submission.status = PuzzleSubmissionStatus.UNDER_REVIEW;
      submission.moderationData = {
        ...submission.moderationData,
        action: 'pending_review' as any,
        flaggedContent: [reason],
      };
      await this.submissionRepository.save(submission);
    }

    this.logger.log(`Puzzle ${submissionId} reported by user ${userId}: ${reason}`);
  }

  async reportComment(
    commentId: string,
    userId: string,
    reason: string,
  ): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.moderationFlags = {
      ...comment.moderationFlags,
      reportedBy: [...(comment.moderationFlags.reportedBy || []), userId],
      reportReasons: [...(comment.moderationFlags.reportReasons || []), reason],
      autoFlagged: true,
    };

    if (comment.moderationFlags.reportedBy.length >= 3) {
      comment.status = PuzzleCommentStatus.FLAGGED;
    }

    await this.commentRepository.save(comment);

    this.logger.log(`Comment ${commentId} reported by user ${userId}: ${reason}`);
  }
}
