import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Email, EmailPriority } from '../emails/entities/email.entity';
import { EmailQueue, QueueStatus } from './entities/email-queue.entity';
import { EmailJobData } from './email.processor';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email-queue')
    private readonly emailQueue: Queue,
    @InjectRepository(EmailQueue)
    private readonly queueRepository: Repository<EmailQueue>,
    private readonly configService: ConfigService,
  ) {}

  async addToQueue(email: Email): Promise<EmailQueue> {
    const queueEntry = this.queueRepository.create({
      emailId: email.id,
      status: QueueStatus.PENDING,
      priority: this.getPriorityValue(email.priority),
      maxAttempts: this.configService.get<number>('email.queue.maxRetries', 5),
      scheduledAt: email.scheduledAt,
    });

    await this.queueRepository.save(queueEntry);

    const jobData: EmailJobData = {
      emailId: email.id,
      queueId: queueEntry.id,
    };

    const delay = email.scheduledAt
      ? Math.max(0, new Date(email.scheduledAt).getTime() - Date.now())
      : 0;

    await this.emailQueue.add('send-email', jobData, {
      delay,
      priority: queueEntry.priority,
      attempts: queueEntry.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: this.configService.get<number>('email.queue.initialDelay', 1000),
      },
      removeOnComplete: {
        age: 24 * 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
      },
    });

    this.logger.log(`Email ${email.id} added to queue with ID ${queueEntry.id}`);
    return queueEntry;
  }

  async addBatchToQueue(emails: Email[]): Promise<EmailQueue[]> {
    const queueEntries: EmailQueue[] = [];

    for (const email of emails) {
      const entry = await this.addToQueue(email);
      queueEntries.push(entry);
    }

    return queueEntries;
  }

  async getQueueStatus(queueId: string): Promise<EmailQueue> {
    return this.queueRepository.findOne({ where: { id: queueId } });
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    deadLetter: number;
  }> {
    const stats = await this.queueRepository
      .createQueryBuilder('queue')
      .select('queue.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('queue.status')
      .getRawMany();

    return {
      pending: parseInt(stats.find((s) => s.status === QueueStatus.PENDING)?.count || '0'),
      processing: parseInt(stats.find((s) => s.status === QueueStatus.PROCESSING)?.count || '0'),
      completed: parseInt(stats.find((s) => s.status === QueueStatus.COMPLETED)?.count || '0'),
      failed: parseInt(stats.find((s) => s.status === QueueStatus.FAILED)?.count || '0'),
      deadLetter: parseInt(stats.find((s) => s.status === QueueStatus.DEAD_LETTER)?.count || '0'),
    };
  }

  async retryFailed(queueId: string): Promise<boolean> {
    const queueEntry = await this.queueRepository.findOne({
      where: { id: queueId, status: QueueStatus.FAILED },
    });

    if (!queueEntry) {
      return false;
    }

    queueEntry.status = QueueStatus.PENDING;
    queueEntry.attempts = 0;
    queueEntry.errorHistory = [];
    await this.queueRepository.save(queueEntry);

    const jobData: EmailJobData = {
      emailId: queueEntry.emailId,
      queueId: queueEntry.id,
    };

    await this.emailQueue.add('send-email', jobData, {
      attempts: queueEntry.maxAttempts,
      backoff: {
        type: 'exponential',
        delay: this.configService.get<number>('email.queue.initialDelay', 1000),
      },
    });

    return true;
  }

  async purgeDeadLetterQueue(olderThan?: Date): Promise<number> {
    const query = this.queueRepository
      .createQueryBuilder()
      .delete()
      .from(EmailQueue)
      .where('status = :status', { status: QueueStatus.DEAD_LETTER });

    if (olderThan) {
      query.andWhere('createdAt < :olderThan', { olderThan });
    }

    const result = await query.execute();
    return result.affected || 0;
  }

  private getPriorityValue(priority: EmailPriority): number {
    switch (priority) {
      case EmailPriority.CRITICAL:
        return 1;
      case EmailPriority.HIGH:
        return 2;
      case EmailPriority.NORMAL:
        return 3;
      case EmailPriority.LOW:
        return 4;
      default:
        return 3;
    }
  }
}
