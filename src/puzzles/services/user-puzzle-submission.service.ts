import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { UserPuzzleSubmission, PuzzleSubmissionStatus } from '../entities/user-puzzle-submission.entity';
import { CreatePuzzleSubmissionDto, UpdatePuzzleSubmissionDto, SubmitForReviewDto } from '../dto/user-puzzle-submission.dto';
import { SearchPuzzlesDto } from '../dto/community-puzzles.dto';
import { PuzzleValidationService } from './puzzle-validation.service';
import { PuzzleModerationService } from './puzzle-moderation.service';

@Injectable()
export class UserPuzzleSubmissionService {
  private readonly logger = new Logger(UserPuzzleSubmissionService.name);

  constructor(
    @InjectRepository(UserPuzzleSubmission)
    private readonly submissionRepository: Repository<UserPuzzleSubmission>,
    private readonly validationService: PuzzleValidationService,
    private readonly moderationService: PuzzleModerationService,
  ) {}

  async createSubmission(
    userId: string,
    createDto: CreatePuzzleSubmissionDto,
  ): Promise<UserPuzzleSubmission> {
    const submission = this.submissionRepository.create({
      userId,
      ...createDto,
      status: PuzzleSubmissionStatus.DRAFT,
      sharingSettings: {
        allowShare: true,
        embeddable: false,
        downloadAllowed: false,
        attributionRequired: true,
        ...createDto.sharingSettings,
      },
    });

    // Generate shareable link if public
    if (createDto.isPublic) {
      submission.sharingSettings.shareableLink = await this.generateShareableLink();
    }

    const savedSubmission = await this.submissionRepository.save(submission);
    
    this.logger.log(`Created puzzle submission ${savedSubmission.id} for user ${userId}`);
    return savedSubmission;
  }

  async getUserSubmissions(
    userId: string,
    status?: PuzzleSubmissionStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    submissions: UserPuzzleSubmission[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where = status ? { userId, status } : { userId };
    
    const [submissions, total] = await this.submissionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSubmissionById(
    submissionId: string,
    userId?: string,
  ): Promise<UserPuzzleSubmission> {
    const where = userId ? { id: submissionId, userId } : { id: submissionId };
    const submission = await this.submissionRepository.findOne({ where });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    // Increment view count for public puzzles
    if (submission.isPublic && submission.status === PuzzleSubmissionStatus.PUBLISHED) {
      await this.submissionRepository.increment({ id: submissionId }, 'views', 1);
    }

    return submission;
  }

  async updateSubmission(
    submissionId: string,
    userId: string,
    updateDto: UpdatePuzzleSubmissionDto,
  ): Promise<UserPuzzleSubmission> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, userId },
    });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    if (submission.status !== PuzzleSubmissionStatus.DRAFT) {
      throw new Error('Only draft submissions can be updated');
    }

    Object.assign(submission, updateDto);
    submission.updatedAt = new Date();

    const savedSubmission = await this.submissionRepository.save(submission);
    
    this.logger.log(`Updated puzzle submission ${submissionId} by user ${userId}`);
    return savedSubmission;
  }

  async deleteSubmission(submissionId: string, userId: string): Promise<void> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId, userId },
    });

    if (!submission) {
      throw new Error('Puzzle submission not found');
    }

    if (submission.status === PuzzleSubmissionStatus.PUBLISHED) {
      throw new Error('Published puzzles cannot be deleted');
    }

    await this.submissionRepository.remove(submission);
    
    this.logger.log(`Deleted puzzle submission ${submissionId} by user ${userId}`);
  }

  async submitForReview(
    submissionId: string,
    userId: string,
    reviewData?: SubmitForReviewDto,
  ): Promise<UserPuzzleSubmission> {
    return await this.moderationService.submitForReview(submissionId, userId, reviewData);
  }

  async publishPuzzle(submissionId: string, userId: string): Promise<UserPuzzleSubmission> {
    return await this.moderationService.publishPuzzle(submissionId, userId);
  }

  async searchCommunityPuzzles(
    searchDto: SearchPuzzlesDto,
  ): Promise<{
    submissions: UserPuzzleSubmission[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      query,
      categories,
      difficulties,
      tags,
      sortBy = 'newest',
      page = 1,
      limit = 20,
      isPublic = true,
    } = searchDto;

    const queryBuilder = this.submissionRepository
      .createQueryBuilder('submission')
      .where('submission.isPublic = :isPublic', { isPublic })
      .andWhere('submission.status = :status', { status: PuzzleSubmissionStatus.PUBLISHED });

    // Text search
    if (query) {
      queryBuilder.andWhere(
        '(submission.title ILIKE :query OR submission.description ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Category filter
    if (categories && categories.length > 0) {
      queryBuilder.andWhere('submission.category IN (:...categories)', { categories });
    }

    // Difficulty filter
    if (difficulties && difficulties.length > 0) {
      queryBuilder.andWhere('submission.difficulty IN (:...difficulties)', { difficulties });
    }

    // Tags filter
    if (tags && tags.length > 0) {
      queryBuilder.andWhere('submission.tags && :tags', { tags });
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        queryBuilder.orderBy('submission.publishedAt', 'DESC');
        break;
      case 'oldest':
        queryBuilder.orderBy('submission.publishedAt', 'ASC');
        break;
      case 'popular':
        queryBuilder.orderBy('submission.views', 'DESC');
        break;
      case 'highest_rated':
        queryBuilder.orderBy('submission.averageRating', 'DESC');
        break;
      case 'most_played':
        queryBuilder.orderBy('submission.playCount', 'DESC');
        break;
      case 'trending':
        // Trending based on recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        queryBuilder
          .orderBy('submission.lastActivityAt', 'DESC')
          .andWhere('submission.lastActivityAt >= :sevenDaysAgo', { sevenDaysAgo });
        break;
    }

    const [submissions, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeaturedPuzzles(limit: number = 10): Promise<UserPuzzleSubmission[]> {
    return await this.submissionRepository.find({
      where: {
        status: PuzzleSubmissionStatus.FEATURED,
        isPublic: true,
      },
      order: { featuredAt: 'DESC' },
      take: limit,
    });
  }

  async getTrendingPuzzles(limit: number = 10): Promise<UserPuzzleSubmission[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await this.submissionRepository
      .createQueryBuilder('submission')
      .where('submission.isPublic = :isPublic', { isPublic: true })
      .andWhere('submission.status = :status', { status: PuzzleSubmissionStatus.PUBLISHED })
      .andWhere('submission.lastActivityAt >= :sevenDaysAgo', { sevenDaysAgo })
      .orderBy('submission.playCount', 'DESC')
      .addOrderBy('submission.averageRating', 'DESC')
      .take(limit)
      .getMany();
  }

  async getRecommendedPuzzles(
    userId: string,
    limit: number = 10,
  ): Promise<UserPuzzleSubmission[]> {
    // Simple recommendation based on user's play history and preferences
    // In a real implementation, this would use a more sophisticated algorithm
    
    return await this.submissionRepository
      .createQueryBuilder('submission')
      .where('submission.isPublic = :isPublic', { isPublic: true })
      .andWhere('submission.status = :status', { status: PuzzleSubmissionStatus.PUBLISHED })
      .andWhere('submission.userId != :userId', { userId })
      .orderBy('submission.communityScore', 'DESC')
      .addOrderBy('submission.averageRating', 'DESC')
      .take(limit)
      .getMany();
  }

  async incrementPlayCount(submissionId: string): Promise<void> {
    await this.submissionRepository.increment({ id: submissionId }, 'playCount', 1);
    await this.submissionRepository.update(
      { id: submissionId },
      { lastActivityAt: new Date() },
    );
  }

  async generateShareableLink(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  async getSubmissionByShareableLink(shareableLink: string): Promise<UserPuzzleSubmission> {
    const submission = await this.submissionRepository
      .createQueryBuilder('submission')
      .where("submission.sharingSettings->>'shareableLink' = :shareableLink", { shareableLink })
      .andWhere('submission.isPublic = :isPublic', { isPublic: true })
      .andWhere('submission.status = :status', { status: PuzzleSubmissionStatus.PUBLISHED })
      .getOne();

    if (!submission) {
      throw new Error('Puzzle not found or not accessible');
    }

    // Increment view count
    await this.submissionRepository.increment({ id: submission.id }, 'views', 1);

    return submission;
  }

  async getCreatorStats(userId: string): Promise<any> {
    return await this.moderationService.getCreatorStats(userId);
  }
}
