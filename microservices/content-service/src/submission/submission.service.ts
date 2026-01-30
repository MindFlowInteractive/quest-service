import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission, SubmissionStatus } from '../entities/submission.entity.js';
import { Content, ContentStatus } from '../entities/content.entity.js';
import { ModerationQueue, QueueStatus, QueuePriority } from '../entities/moderation-queue.entity.js';
import { ContentService } from '../content/content.service.js';
import { ContentValidationService } from './content-validation.service.js';
import { CreateSubmissionDto } from './dto/create-submission.dto.js';
import { SubmissionFilterDto } from './dto/submission-filter.dto.js';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(ModerationQueue)
    private readonly queueRepository: Repository<ModerationQueue>,
    private readonly contentService: ContentService,
    private readonly validationService: ContentValidationService,
  ) {}

  async submit(
    contentId: string,
    userId: string,
    createSubmissionDto: CreateSubmissionDto,
  ): Promise<Submission> {
    const content = await this.contentService.findOne(contentId);

    if (content.userId !== userId) {
      throw new ForbiddenException('You can only submit your own content');
    }

    if (content.status !== ContentStatus.DRAFT && content.status !== ContentStatus.REJECTED) {
      throw new BadRequestException(
        `Cannot submit content with status ${content.status}. Only draft or rejected content can be submitted.`,
      );
    }

    const existingPendingSubmission = await this.submissionRepository.findOne({
      where: {
        contentId,
        status: SubmissionStatus.PENDING,
      },
    });

    if (existingPendingSubmission) {
      throw new BadRequestException('Content already has a pending submission');
    }

    const lastSubmission = await this.submissionRepository.findOne({
      where: { contentId },
      order: { version: 'DESC' },
    });

    const version = lastSubmission ? lastSubmission.version + 1 : 1;

    const validationResults = await this.validationService.validateContent(content);

    const submission = this.submissionRepository.create({
      contentId,
      submittedBy: userId,
      status: SubmissionStatus.PENDING,
      version,
      snapshot: {
        title: content.title,
        description: content.description,
        content: content.content,
        metadata: content.metadata,
        tags: content.tags,
        category: content.category,
      },
      submitterNotes: createSubmissionDto.submitterNotes,
      validationResults,
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    await this.contentService.updateStatus(contentId, ContentStatus.SUBMITTED);

    if (validationResults.autoApprovalEligible) {
      this.logger.log(`Submission ${savedSubmission.id} eligible for auto-approval`);
      await this.autoApprove(savedSubmission);
    } else {
      await this.addToModerationQueue(savedSubmission);
    }

    this.logger.log(`Submission created: ${savedSubmission.id} for content ${contentId}`);
    return savedSubmission;
  }

  async findAll(filterDto: SubmissionFilterDto): Promise<{ data: Submission[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.content', 'content');

    if (filterDto.userId) {
      queryBuilder.andWhere('submission.submittedBy = :userId', { userId: filterDto.userId });
    }

    if (filterDto.contentId) {
      queryBuilder.andWhere('submission.contentId = :contentId', { contentId: filterDto.contentId });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('submission.status = :status', { status: filterDto.status });
    }

    queryBuilder
      .orderBy(`submission.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findByUser(userId: string, filterDto: SubmissionFilterDto): Promise<{ data: Submission[]; total: number; page: number; limit: number }> {
    return this.findAll({ ...filterDto, userId });
  }

  async findOne(id: string): Promise<Submission> {
    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ['content', 'moderationActions'],
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }

    return submission;
  }

  async cancel(id: string, userId: string): Promise<void> {
    const submission = await this.findOne(id);

    if (submission.submittedBy !== userId) {
      throw new ForbiddenException('You can only cancel your own submissions');
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel submission with status ${submission.status}. Only pending submissions can be cancelled.`,
      );
    }

    submission.status = SubmissionStatus.CANCELLED;
    await this.submissionRepository.save(submission);

    await this.queueRepository.delete({ submissionId: id });

    await this.contentService.updateStatus(submission.contentId, ContentStatus.DRAFT);

    this.logger.log(`Submission cancelled: ${id}`);
  }

  async resubmit(id: string, userId: string, createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    const oldSubmission = await this.findOne(id);

    if (oldSubmission.submittedBy !== userId) {
      throw new ForbiddenException('You can only resubmit your own submissions');
    }

    if (oldSubmission.status !== SubmissionStatus.REJECTED && oldSubmission.status !== SubmissionStatus.REQUIRES_CHANGES) {
      throw new BadRequestException(
        `Cannot resubmit submission with status ${oldSubmission.status}. Only rejected submissions or those requiring changes can be resubmitted.`,
      );
    }

    return this.submit(oldSubmission.contentId, userId, createSubmissionDto);
  }

  async updateStatus(id: string, status: SubmissionStatus, moderatorId?: string): Promise<Submission> {
    const submission = await this.findOne(id);
    submission.status = status;

    if (status === SubmissionStatus.IN_REVIEW && moderatorId) {
      submission.assignedModerator = moderatorId;
      submission.reviewStartedAt = new Date();
    } else if (
      status === SubmissionStatus.APPROVED ||
      status === SubmissionStatus.REJECTED ||
      status === SubmissionStatus.REQUIRES_CHANGES
    ) {
      submission.reviewCompletedAt = new Date();
    }

    return this.submissionRepository.save(submission);
  }

  private async autoApprove(submission: Submission): Promise<void> {
    submission.status = SubmissionStatus.APPROVED;
    submission.reviewCompletedAt = new Date();
    await this.submissionRepository.save(submission);

    await this.contentService.updateStatus(submission.contentId, ContentStatus.PUBLISHED);
    await this.contentService.updateQualityScore(
      submission.contentId,
      submission.validationResults.score,
    );

    this.logger.log(`Submission ${submission.id} auto-approved`);
  }

  private async addToModerationQueue(submission: Submission): Promise<void> {
    const priority = this.calculatePriority(submission);

    const dueAt = new Date();
    switch (priority) {
      case QueuePriority.URGENT:
        dueAt.setHours(dueAt.getHours() + 4);
        break;
      case QueuePriority.HIGH:
        dueAt.setHours(dueAt.getHours() + 12);
        break;
      case QueuePriority.NORMAL:
        dueAt.setHours(dueAt.getHours() + 48);
        break;
      default:
        dueAt.setHours(dueAt.getHours() + 72);
    }

    const queueEntry = this.queueRepository.create({
      submissionId: submission.id,
      status: QueueStatus.PENDING,
      priority,
      dueAt,
    });

    await this.queueRepository.save(queueEntry);
    this.logger.log(`Submission ${submission.id} added to moderation queue with priority ${priority}`);
  }

  private calculatePriority(submission: Submission): QueuePriority {
    const score = submission.validationResults?.score || 0;

    if (score >= 80) return QueuePriority.HIGH;
    if (score >= 60) return QueuePriority.NORMAL;
    if (score >= 40) return QueuePriority.LOW;

    return QueuePriority.NORMAL;
  }
}
