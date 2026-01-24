/**
 * Community Submission Service
 * Manages community puzzle submissions and moderation workflow
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CommunitySubmission } from '../entities/community-submission.entity';
import { CommunityReview } from '../entities/community-review.entity';
import { PuzzleEditor } from '../entities/puzzle-editor.entity';
import {
  SubmitToCommunityDto,
  ReviewSubmissionDto,
  ApproveSubmissionDto,
  RejectSubmissionDto,
} from '../dto';

@Injectable()
export class CommunitySubmissionService {
  private readonly logger = new Logger(CommunitySubmissionService.name);

  constructor(
    @InjectRepository(CommunitySubmission)
    private submissionRepository: Repository<CommunitySubmission>,
    @InjectRepository(CommunityReview)
    private reviewRepository: Repository<CommunityReview>,
    @InjectRepository(PuzzleEditor)
    private editorRepository: Repository<PuzzleEditor>,
  ) {}

  /**
   * Submit puzzle to community
   */
  async submitPuzzle(
    editorId: string,
    dto: SubmitToCommunityDto,
    userId: string,
  ): Promise<CommunitySubmission> {
    const editor = await this.editorRepository.findOne({
      where: { id: editorId },
    });

    if (!editor) {
      throw new NotFoundException(`Puzzle editor ${editorId} not found`);
    }

    // Check permissions
    if (editor.createdBy !== userId) {
      throw new ForbiddenException('You can only submit your own puzzles');
    }

    // Check if already submitted
    const existingSubmission = await this.submissionRepository.findOne({
      where: { puzzleEditorId: editorId },
    });

    if (existingSubmission && existingSubmission.status !== 'REJECTED' && existingSubmission.status !== 'ARCHIVED') {
      throw new ConflictException('This puzzle has already been submitted');
    }

    const submission = this.submissionRepository.create({
      puzzleEditorId: editorId,
      submittedBy: userId,
      status: 'SUBMITTED',
      category: dto.category,
      title: dto.title,
      description: dto.description,
      tags: dto.tags,
      metadata: {
        playtestSessions: 0,
        avgPlaytestRating: 0,
        commonIssues: [],
        estimatedDifficulty: 'MEDIUM',
        recommendedAgeGroup: dto.recommendedAgeGroup,
        lastUpdated: new Date(),
        viewCount: 0,
        downloadCount: 0,
      },
    });

    const saved = await this.submissionRepository.save(submission);

    // Update editor status
    editor.status = 'PUBLISHED';
    await this.editorRepository.save(editor);

    this.logger.log(`Submitted puzzle ${editorId} to community by user ${userId}`);

    return saved;
  }

  /**
   * Get submission by ID
   */
  async getSubmission(submissionId: string): Promise<CommunitySubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['reviews'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    // Increment view count
    submission.metadata.viewCount++;
    await this.submissionRepository.save(submission);

    return submission;
  }

  /**
   * Search submissions
   */
  async searchSubmissions(filters?: {
    status?: string;
    category?: string;
    tags?: string[];
    search?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    submissions: CommunitySubmission[];
    total: number;
  }> {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 20, 100);
    const skip = (page - 1) * limit;

    let query = this.submissionRepository.createQueryBuilder('submission');

    if (filters?.status) {
      query = query.where('submission.status = :status', { status: filters.status });
    }

    if (filters?.category) {
      query = query.andWhere('submission.category = :category', { category: filters.category });
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.andWhere('submission.tags && :tags', { tags: filters.tags });
    }

    if (filters?.search) {
      query = query.andWhere(
        '(submission.title ILIKE :search OR submission.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Sort
    const sortBy = filters?.sortBy || 'submittedAt';
    const validSortFields = ['submittedAt', 'upvotes', 'downvotes', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'submittedAt';

    query = query.orderBy(`submission.${sortField}`, 'DESC');

    const [submissions, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { submissions, total };
  }

  /**
   * Get submissions for moderation queue
   */
  async getModerationQueue(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    submissions: CommunitySubmission[];
    total: number;
  }> {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const statuses = filters?.status ? [filters.status] : ['SUBMITTED', 'UNDER_REVIEW'];

    const [submissions, total] = await this.submissionRepository.findAndCount({
      where: { status: In(statuses) },
      relations: ['reviews'],
      order: { submittedAt: 'ASC' },
      skip,
      take: limit,
    });

    return { submissions, total };
  }

  /**
   * Review submission
   */
  async reviewSubmission(
    submissionId: string,
    dto: ReviewSubmissionDto,
    reviewerId: string,
    reviewerRole: string,
  ): Promise<CommunityReview> {
    const submission = await this.getSubmission(submissionId);

    const review = this.reviewRepository.create({
      submissionId,
      reviewedBy: reviewerId,
      role: reviewerRole,
      status: dto.status,
      rating: dto.rating,
      feedback: dto.feedback,
      suggestions: dto.suggestions || [],
      checklist: dto.checklist || [],
      requestedChanges: dto.requestedChanges,
    });

    const saved = await this.reviewRepository.save(review);

    // Update submission status
    if (dto.status === 'APPROVED') {
      submission.status = 'APPROVED';
    } else if (dto.status === 'REJECTED') {
      submission.status = 'REJECTED';
      submission.rejectionReason = dto.requestedChanges || 'Rejected by moderator';
    } else if (dto.status === 'REQUESTED_CHANGES') {
      submission.status = 'UNDER_REVIEW';
    }

    await this.submissionRepository.save(submission);

    this.logger.log(`Review created for submission ${submissionId} by ${reviewerId}`);

    return saved;
  }

  /**
   * Approve submission
   */
  async approveSubmission(
    submissionId: string,
    dto: ApproveSubmissionDto,
    approverId: string,
  ): Promise<CommunitySubmission> {
    const submission = await this.getSubmission(submissionId);

    if (submission.status === 'APPROVED') {
      throw new ConflictException('Submission is already approved');
    }

    submission.status = 'APPROVED';
    submission.approvedBy = approverId;
    submission.approvedAt = new Date();

    if (dto.feedback) {
      // Add approval review
      await this.reviewRepository.create({
        submissionId,
        reviewedBy: approverId,
        role: 'ADMIN',
        status: 'APPROVED',
        rating: 5,
        feedback: dto.feedback,
        suggestions: [],
        checklist: [],
      });
    }

    const saved = await this.submissionRepository.save(submission);

    this.logger.log(`Approved submission ${submissionId}`);

    return saved;
  }

  /**
   * Reject submission
   */
  async rejectSubmission(
    submissionId: string,
    dto: RejectSubmissionDto,
    rejecterId: string,
  ): Promise<CommunitySubmission> {
    const submission = await this.getSubmission(submissionId);

    submission.status = 'REJECTED';
    submission.rejectionReason = dto.reason;

    // Add rejection review
    await this.reviewRepository.create({
      submissionId,
      reviewedBy: rejecterId,
      role: 'ADMIN',
      status: 'REJECTED',
      rating: 1,
      feedback: dto.feedback || dto.reason,
      suggestions: [],
      checklist: [],
      requestedChanges: dto.reason,
    });

    const saved = await this.submissionRepository.save(submission);

    this.logger.log(`Rejected submission ${submissionId}`);

    return saved;
  }

  /**
   * Feature submission
   */
  async featureSubmission(submissionId: string, approverId: string): Promise<CommunitySubmission> {
    const submission = await this.getSubmission(submissionId);

    if (submission.status !== 'APPROVED') {
      throw new BadRequestException('Only approved submissions can be featured');
    }

    submission.status = 'FEATURED';
    return this.submissionRepository.save(submission);
  }

  /**
   * Upvote submission
   */
  async upvoteSubmission(submissionId: string, userId: string): Promise<CommunitySubmission> {
    const submission = await this.getSubmission(submissionId);

    submission.upvotes++;
    submission.metadata.viewCount++;

    return this.submissionRepository.save(submission);
  }

  /**
   * Downvote submission
   */
  async downvoteSubmission(submissionId: string, userId: string): Promise<CommunitySubmission> {
    const submission = await this.getSubmission(submissionId);

    submission.downvotes++;
    submission.metadata.viewCount++;

    return this.submissionRepository.save(submission);
  }

  /**
   * Get community stats
   */
  async getCommunityStats(): Promise<{
    totalSubmissions: number;
    approvedSubmissions: number;
    featuredSubmissions: number;
    totalReviews: number;
    averageRating: number;
    topContributors: any[];
  }> {
    const submissions = await this.submissionRepository.find();
    const reviews = await this.reviewRepository.find();

    const approved = submissions.filter((s) => s.status === 'APPROVED').length;
    const featured = submissions.filter((s) => s.status === 'FEATURED').length;

    const avgRating =
      reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    // Get top contributors
    const submissionsByUser: Record<string, number> = {};
    submissions.forEach((s) => {
      submissionsByUser[s.submittedBy] = (submissionsByUser[s.submittedBy] || 0) + 1;
    });

    const topContributors = Object.entries(submissionsByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, submissionCount: count }));

    return {
      totalSubmissions: submissions.length,
      approvedSubmissions: approved,
      featuredSubmissions: featured,
      totalReviews: reviews.length,
      averageRating: parseFloat(avgRating.toFixed(2)),
      topContributors,
    };
  }
}
