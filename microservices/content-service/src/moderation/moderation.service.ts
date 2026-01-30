import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ModerationQueue, QueueStatus, QueuePriority } from '../entities/moderation-queue.entity.js';
import { ModerationAction, ModerationActionType, ModerationDecision } from '../entities/moderation-action.entity.js';
import { Submission, SubmissionStatus } from '../entities/submission.entity.js';
import { Content, ContentStatus } from '../entities/content.entity.js';
import { ContentService } from '../content/content.service.js';
import { SubmissionService } from '../submission/submission.service.js';
import { QueueFilterDto } from './dto/queue-filter.dto.js';
import {
  ApproveSubmissionDto,
  RejectSubmissionDto,
  RequestChangesDto,
  FlagContentDto,
} from './dto/moderation-action.dto.js';

export interface ModerationStats {
  totalPending: number;
  totalInProgress: number;
  totalCompletedToday: number;
  averageReviewTime: number;
  escalatedCount: number;
  overdueCount: number;
  byPriority: Record<QueuePriority, number>;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @InjectRepository(ModerationQueue)
    private readonly queueRepository: Repository<ModerationQueue>,
    @InjectRepository(ModerationAction)
    private readonly actionRepository: Repository<ModerationAction>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    private readonly contentService: ContentService,
    private readonly submissionService: SubmissionService,
  ) {}

  async getQueue(filterDto: QueueFilterDto): Promise<{ data: ModerationQueue[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'ASC' } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.queueRepository
      .createQueryBuilder('queue')
      .leftJoinAndSelect('queue.submission', 'submission')
      .leftJoinAndSelect('submission.content', 'content');

    if (filterDto.status) {
      queryBuilder.andWhere('queue.status = :status', { status: filterDto.status });
    }

    if (filterDto.priority) {
      queryBuilder.andWhere('queue.priority = :priority', { priority: filterDto.priority });
    }

    if (filterDto.assignedTo) {
      queryBuilder.andWhere('queue.assignedTo = :assignedTo', { assignedTo: filterDto.assignedTo });
    }

    if (filterDto.isEscalated !== undefined) {
      queryBuilder.andWhere('queue.isEscalated = :isEscalated', { isEscalated: filterDto.isEscalated });
    }

    if (filterDto.overdue) {
      queryBuilder.andWhere('queue.dueAt < :now', { now: new Date() });
    }

    if (sortBy === 'priority') {
      queryBuilder.orderBy(
        `CASE queue.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END`,
        sortOrder,
      );
    } else {
      queryBuilder.orderBy(`queue.${sortBy}`, sortOrder);
    }

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async claimItem(queueId: string, moderatorId: string): Promise<ModerationQueue> {
    const queueEntry = await this.queueRepository.findOne({
      where: { id: queueId },
      relations: ['submission'],
    });

    if (!queueEntry) {
      throw new NotFoundException(`Queue entry with ID ${queueId} not found`);
    }

    if (queueEntry.status !== QueueStatus.PENDING) {
      throw new BadRequestException(`Queue entry is already ${queueEntry.status}`);
    }

    queueEntry.status = QueueStatus.ASSIGNED;
    queueEntry.assignedTo = moderatorId;
    queueEntry.assignedAt = new Date();

    await this.queueRepository.save(queueEntry);

    await this.submissionService.updateStatus(
      queueEntry.submissionId,
      SubmissionStatus.IN_REVIEW,
      moderatorId,
    );

    this.logger.log(`Queue item ${queueId} claimed by moderator ${moderatorId}`);
    return queueEntry;
  }

  async approve(
    submissionId: string,
    moderatorId: string,
    approveDto: ApproveSubmissionDto,
  ): Promise<ModerationAction> {
    const submission = await this.submissionService.findOne(submissionId);

    if (submission.status !== SubmissionStatus.PENDING && submission.status !== SubmissionStatus.IN_REVIEW) {
      throw new BadRequestException(`Cannot approve submission with status ${submission.status}`);
    }

    const action = this.actionRepository.create({
      submissionId,
      moderatorId,
      actionType: ModerationActionType.APPROVE,
      decision: ModerationDecision.MANUALLY_APPROVED,
      notes: approveDto.notes,
      qualityScore: approveDto.qualityScore,
      isAutomated: false,
    });

    await this.actionRepository.save(action);

    await this.submissionService.updateStatus(submissionId, SubmissionStatus.APPROVED, moderatorId);

    await this.contentService.updateStatus(submission.contentId, ContentStatus.PUBLISHED);

    if (approveDto.qualityScore !== undefined) {
      await this.contentService.updateQualityScore(submission.contentId, approveDto.qualityScore);
    }

    await this.completeQueueEntry(submissionId);

    this.logger.log(`Submission ${submissionId} approved by moderator ${moderatorId}`);
    return action;
  }

  async reject(
    submissionId: string,
    moderatorId: string,
    rejectDto: RejectSubmissionDto,
  ): Promise<ModerationAction> {
    const submission = await this.submissionService.findOne(submissionId);

    if (submission.status !== SubmissionStatus.PENDING && submission.status !== SubmissionStatus.IN_REVIEW) {
      throw new BadRequestException(`Cannot reject submission with status ${submission.status}`);
    }

    const action = this.actionRepository.create({
      submissionId,
      moderatorId,
      actionType: ModerationActionType.REJECT,
      decision: rejectDto.decision,
      notes: rejectDto.notes,
      flaggedContent: rejectDto.flaggedContent,
      isAutomated: false,
    });

    await this.actionRepository.save(action);

    await this.submissionService.updateStatus(submissionId, SubmissionStatus.REJECTED, moderatorId);

    await this.contentService.updateStatus(submission.contentId, ContentStatus.REJECTED);

    await this.completeQueueEntry(submissionId);

    this.logger.log(`Submission ${submissionId} rejected by moderator ${moderatorId}`);
    return action;
  }

  async requestChanges(
    submissionId: string,
    moderatorId: string,
    requestChangesDto: RequestChangesDto,
  ): Promise<ModerationAction> {
    const submission = await this.submissionService.findOne(submissionId);

    if (submission.status !== SubmissionStatus.PENDING && submission.status !== SubmissionStatus.IN_REVIEW) {
      throw new BadRequestException(`Cannot request changes for submission with status ${submission.status}`);
    }

    const action = this.actionRepository.create({
      submissionId,
      moderatorId,
      actionType: ModerationActionType.REQUEST_CHANGES,
      decision: ModerationDecision.REQUIRES_CHANGES,
      notes: requestChangesDto.notes,
      requiredChanges: requestChangesDto.requiredChanges,
      isAutomated: false,
    });

    await this.actionRepository.save(action);

    await this.submissionService.updateStatus(submissionId, SubmissionStatus.REQUIRES_CHANGES, moderatorId);

    await this.contentService.updateStatus(submission.contentId, ContentStatus.REJECTED);

    await this.completeQueueEntry(submissionId);

    this.logger.log(`Changes requested for submission ${submissionId} by moderator ${moderatorId}`);
    return action;
  }

  async flagContent(
    contentId: string,
    reporterId: string,
    flagDto: FlagContentDto,
  ): Promise<ModerationAction> {
    const content = await this.contentService.findOne(contentId);

    const latestSubmission = await this.submissionRepository.findOne({
      where: { contentId },
      order: { version: 'DESC' },
    });

    const action = this.actionRepository.create({
      submissionId: latestSubmission?.id,
      moderatorId: reporterId,
      actionType: ModerationActionType.FLAG,
      notes: flagDto.reason,
      flaggedContent: flagDto.flaggedContent,
      isAutomated: false,
    });

    await this.actionRepository.save(action);

    if (latestSubmission && latestSubmission.status === SubmissionStatus.APPROVED) {
      const existingQueueEntry = await this.queueRepository.findOne({
        where: { submissionId: latestSubmission.id },
      });

      if (!existingQueueEntry) {
        const queueEntry = this.queueRepository.create({
          submissionId: latestSubmission.id,
          status: QueueStatus.PENDING,
          priority: QueuePriority.HIGH,
          isEscalated: true,
          escalationReason: `Flagged by user: ${flagDto.reason}`,
          dueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        });
        await this.queueRepository.save(queueEntry);
      }
    }

    this.logger.log(`Content ${contentId} flagged by user ${reporterId}`);
    return action;
  }

  async getStats(): Promise<ModerationStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalPending,
      totalInProgress,
      totalCompletedToday,
      escalatedCount,
      overdueCount,
    ] = await Promise.all([
      this.queueRepository.count({ where: { status: QueueStatus.PENDING } }),
      this.queueRepository.count({ where: { status: QueueStatus.IN_PROGRESS } }),
      this.queueRepository.count({
        where: {
          status: QueueStatus.COMPLETED,
          updatedAt: LessThan(todayStart),
        },
      }),
      this.queueRepository.count({ where: { isEscalated: true, status: QueueStatus.PENDING } }),
      this.queueRepository.count({
        where: {
          status: QueueStatus.PENDING,
          dueAt: LessThan(now),
        },
      }),
    ]);

    const byPriorityResults = await this.queueRepository
      .createQueryBuilder('queue')
      .select('queue.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('queue.status = :status', { status: QueueStatus.PENDING })
      .groupBy('queue.priority')
      .getRawMany();

    const byPriority: Record<QueuePriority, number> = {
      [QueuePriority.LOW]: 0,
      [QueuePriority.NORMAL]: 0,
      [QueuePriority.HIGH]: 0,
      [QueuePriority.URGENT]: 0,
    };

    byPriorityResults.forEach((result) => {
      byPriority[result.priority as QueuePriority] = parseInt(result.count, 10);
    });

    const avgReviewResult = await this.submissionRepository
      .createQueryBuilder('submission')
      .select(
        'AVG(EXTRACT(EPOCH FROM (submission.reviewCompletedAt - submission.reviewStartedAt)))',
        'avgSeconds',
      )
      .where('submission.reviewCompletedAt IS NOT NULL')
      .andWhere('submission.reviewStartedAt IS NOT NULL')
      .getRawOne();

    const averageReviewTime = avgReviewResult?.avgSeconds
      ? Math.round(parseFloat(avgReviewResult.avgSeconds) / 60)
      : 0;

    return {
      totalPending,
      totalInProgress,
      totalCompletedToday,
      averageReviewTime,
      escalatedCount,
      overdueCount,
      byPriority,
    };
  }

  async escalate(queueId: string, reason: string): Promise<ModerationQueue> {
    const queueEntry = await this.queueRepository.findOne({ where: { id: queueId } });

    if (!queueEntry) {
      throw new NotFoundException(`Queue entry with ID ${queueId} not found`);
    }

    queueEntry.isEscalated = true;
    queueEntry.escalationReason = reason;
    queueEntry.priority = QueuePriority.URGENT;

    await this.queueRepository.save(queueEntry);
    this.logger.log(`Queue item ${queueId} escalated: ${reason}`);
    return queueEntry;
  }

  private async completeQueueEntry(submissionId: string): Promise<void> {
    const queueEntry = await this.queueRepository.findOne({
      where: { submissionId },
    });

    if (queueEntry) {
      queueEntry.status = QueueStatus.COMPLETED;
      queueEntry.reviewCount += 1;
      await this.queueRepository.save(queueEntry);
    }
  }
}
