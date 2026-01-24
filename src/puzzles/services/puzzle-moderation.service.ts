import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, In } from 'typeorm';
import { UserPuzzleSubmission, PuzzleSubmissionStatus, ModerationAction } from '../entities/user-puzzle-submission.entity';
import { ModerationDecisionDto, SubmitForReviewDto } from '../dto/user-puzzle-submission.dto';
import { PuzzleValidationService } from './puzzle-validation.service';

@Injectable()
export class PuzzleModerationService {
  private readonly logger = new Logger(PuzzleModerationService.name);

  constructor(
    @InjectRepository(UserPuzzleSubmission)
    private readonly submissionRepository: Repository<UserPuzzleSubmission>,
    private readonly validationService: PuzzleValidationService,
  ) {}

  async submitForReview(
    submissionId: string,
    userId: string,
    reviewData?: SubmitForReviewDto,
  ): Promise<UserPuzzleSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, userId },
    });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    if (submission.status !== PuzzleSubmissionStatus.DRAFT) {
      throw new Error('Only draft submissions can be submitted for review');
    }

    // Run validation
    const validationResults = await this.validationService.validatePuzzle(submission);
    
    // Check for duplicates
    const duplicateCheck = await this.validationService.checkForDuplicates(submission);

    // Update submission with validation results
    submission.validationResults = validationResults;
    submission.status = PuzzleSubmissionStatus.SUBMITTED;
    submission.submittedAt = new Date();

    // Auto-approve if validation passes and no duplicates
    if (validationResults.isValid && !duplicateCheck.isDuplicate && validationResults.score >= 85) {
      submission.status = PuzzleSubmissionStatus.APPROVED;
      submission.moderationData = {
        action: ModerationAction.AUTO_APPROVED,
        autoApprovalScore: validationResults.score,
        qualityScore: validationResults.automatedChecks.contentQuality,
      };
    } else if (duplicateCheck.isDuplicate) {
      submission.status = PuzzleSubmissionStatus.REJECTED;
      submission.moderationData = {
        action: ModerationAction.REJECTED_DUPLICATE,
        reviewNotes: `Duplicate of: ${duplicateCheck.similarPuzzles.map(p => p.title).join(', ')}`,
      };
    } else {
      submission.status = PuzzleSubmissionStatus.UNDER_REVIEW;
      submission.moderationData = {
        action: ModerationAction.PENDING_REVIEW,
        autoApprovalScore: validationResults.score,
        qualityScore: validationResults.automatedChecks.contentQuality,
        requiredChanges: validationResults.errors.length > 0 ? validationResults.errors : undefined,
      };
    }

    await this.submissionRepository.save(submission);

    this.logger.log(`Puzzle ${submissionId} submitted for review with status: ${submission.status}`);
    return submission;
  }

  async getModerationQueue(
    status?: PuzzleSubmissionStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    submissions: UserPuzzleSubmission[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where = status ? { status } : {};
    
    const [submissions, total] = await this.submissionRepository.findAndCount({
      where,
      order: { submittedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return {
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async moderatePuzzle(
    submissionId: string,
    moderatorId: string,
    decision: ModerationDecisionDto,
  ): Promise<UserPuzzleSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['user'],
    });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    if (submission.status !== PuzzleSubmissionStatus.UNDER_REVIEW) {
      throw new Error('Only submissions under review can be moderated');
    }

    // Update moderation data
    submission.moderationData = {
      ...submission.moderationData,
      action: decision.action,
      reviewedBy: moderatorId,
      reviewedAt: new Date(),
      reviewNotes: decision.reviewNotes,
      qualityScore: decision.qualityScore,
      requiredChanges: decision.requiredChanges,
    };

    // Update status based on decision
    switch (decision.action) {
      case ModerationAction.MANUALLY_APPROVED:
        submission.status = PuzzleSubmissionStatus.APPROVED;
        break;
      case ModerationAction.REJECTED_CONTENT:
      case ModerationAction.REJECTED_QUALITY:
      case ModerationAction.REJECTED_DUPLICATE:
      case ModerationAction.REJECTED_INAPPROPRIATE:
        submission.status = PuzzleSubmissionStatus.REJECTED;
        break;
      case ModerationAction.REQUIRES_CHANGES:
        submission.status = PuzzleSubmissionStatus.DRAFT;
        break;
      default:
        throw new Error(`Invalid moderation action: ${decision.action}`);
    }

    await this.submissionRepository.save(submission);

    this.logger.log(
      `Puzzle ${submissionId} moderated by ${moderatorId} with action: ${decision.action}`,
    );

    return submission;
  }

  async publishPuzzle(submissionId: string, userId: string): Promise<UserPuzzleSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, userId },
    });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    if (submission.status !== PuzzleSubmissionStatus.APPROVED) {
      throw new Error('Only approved puzzles can be published');
    }

    submission.status = PuzzleSubmissionStatus.PUBLISHED;
    submission.publishedAt = new Date();
    submission.isPublic = true;

    await this.submissionRepository.save(submission);

    this.logger.log(`Puzzle ${submissionId} published by user ${userId}`);
    return submission;
  }

  async getPendingModerationCount(): Promise<number> {
    return await this.submissionRepository.count({
      where: { status: PuzzleSubmissionStatus.UNDER_REVIEW },
    });
  }

  async getModerationStats(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    total: number;
    approved: number;
    rejected: number;
    autoApproved: number;
    averageQualityScore: number;
    averageProcessingTime: number;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const submissions = await this.submissionRepository.find({
      where: {
        submittedAt: Between(startDate, now),
        status: In([PuzzleSubmissionStatus.APPROVED, PuzzleSubmissionStatus.REJECTED]),
      },
    });

    const stats = {
      total: submissions.length,
      approved: submissions.filter(s => s.status === PuzzleSubmissionStatus.APPROVED).length,
      rejected: submissions.filter(s => s.status === PuzzleSubmissionStatus.REJECTED).length,
      autoApproved: submissions.filter(s => s.moderationData?.action === ModerationAction.AUTO_APPROVED).length,
      averageQualityScore: 0,
      averageProcessingTime: 0,
    };

    if (submissions.length > 0) {
      const qualityScores = submissions
        .map(s => s.moderationData?.qualityScore || 0)
        .filter(score => score > 0);
      
      stats.averageQualityScore = qualityScores.length > 0 
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
        : 0;

      const processingTimes = submissions
        .map(s => {
          if (s.submittedAt && s.moderationData?.reviewedAt) {
            return s.moderationData.reviewedAt.getTime() - s.submittedAt.getTime();
          }
          return 0;
        })
        .filter(time => time > 0);

      stats.averageProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;
    }

    return stats;
  }

  async flagInappropriateContent(
    submissionId: string,
    reporterId: string,
    reason: string,
  ): Promise<UserPuzzleSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    // Add to moderation queue for review
    if (submission.status === PuzzleSubmissionStatus.PUBLISHED) {
      submission.status = PuzzleSubmissionStatus.UNDER_REVIEW;
      submission.moderationData = {
        ...submission.moderationData,
        action: ModerationAction.PENDING_REVIEW,
        flaggedContent: [...(submission.moderationData?.flaggedContent || []), reason],
      };
    }

    await this.submissionRepository.save(submission);

    this.logger.log(`Puzzle ${submissionId} flagged by user ${reporterId}: ${reason}`);
    return submission;
  }

  async getCreatorStats(userId: string): Promise<{
    totalSubmissions: number;
    publishedPuzzles: number;
    averageRating: number;
    totalPlays: number;
    featuredCount: number;
    acceptanceRate: number;
  }> {
    const submissions = await this.submissionRepository.find({
      where: { userId },
    });

    const published = submissions.filter(s => s.status === PuzzleSubmissionStatus.PUBLISHED);
    const featured = submissions.filter(s => s.status === PuzzleSubmissionStatus.FEATURED);

    const averageRating = published.length > 0
      ? published.reduce((sum, s) => sum + s.averageRating, 0) / published.length
      : 0;

    const totalPlays = published.reduce((sum, s) => sum + s.playCount, 0);
    const acceptanceRate = submissions.length > 0
      ? (published.length / submissions.length) * 100
      : 0;

    return {
      totalSubmissions: submissions.length,
      publishedPuzzles: published.length,
      averageRating,
      totalPlays,
      featuredCount: featured.length,
      acceptanceRate,
    };
  }
}
