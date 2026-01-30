import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email, EmailStatus } from '../emails/entities/email.entity';
import { EmailQueue, QueueStatus } from './entities/email-queue.entity';
import { EmailProviderFactory } from '../providers/email-provider.factory';
import { UnsubscribeService } from '../unsubscribe/unsubscribe.service';

export interface EmailJobData {
  emailId: string;
  queueId: string;
}

@Injectable()
@Processor('email-queue', {
  concurrency: 5,
  limiter: {
    max: 100,
    duration: 60000,
  },
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(EmailQueue)
    private readonly queueRepository: Repository<EmailQueue>,
    private readonly providerFactory: EmailProviderFactory,
    private readonly unsubscribeService: UnsubscribeService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    const { emailId, queueId } = job.data;
    this.logger.log(`Processing email job ${job.id} for email ${emailId}`);

    const email = await this.emailRepository.findOne({ where: { id: emailId } });
    if (!email) {
      throw new Error(`Email ${emailId} not found`);
    }

    const queueEntry = await this.queueRepository.findOne({ where: { id: queueId } });
    if (!queueEntry) {
      throw new Error(`Queue entry ${queueId} not found`);
    }

    const isUnsubscribed = await this.unsubscribeService.isUnsubscribed(
      email.toEmail,
      email.type,
    );

    if (isUnsubscribed) {
      this.logger.log(`Email ${emailId} skipped - recipient unsubscribed`);
      await this.updateEmailStatus(email, EmailStatus.FAILED, 'Recipient unsubscribed');
      await this.updateQueueStatus(queueEntry, QueueStatus.COMPLETED);
      return { skipped: true, reason: 'unsubscribed' };
    }

    await this.updateQueueStatus(queueEntry, QueueStatus.PROCESSING);

    try {
      const result = await this.providerFactory.send({
        to: email.toEmail,
        toName: email.toName,
        from: email.fromEmail,
        fromName: email.fromName,
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.htmlContent,
        text: email.textContent,
        headers: email.headers,
        attachments: email.attachments,
        metadata: email.metadata,
      });

      if (result.success) {
        email.messageId = result.messageId;
        email.provider = result.provider;
        email.status = EmailStatus.SENT;
        email.sentAt = new Date();
        await this.emailRepository.save(email);

        await this.updateQueueStatus(queueEntry, QueueStatus.COMPLETED);

        this.logger.log(`Email ${emailId} sent successfully via ${result.provider}`);
        return { success: true, messageId: result.messageId };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      this.logger.error(`Error sending email ${emailId}: ${error.message}`);

      email.retryCount += 1;
      email.lastError = error.message;
      await this.emailRepository.save(email);

      queueEntry.attempts += 1;
      queueEntry.lastAttemptAt = new Date();
      queueEntry.lastError = error.message;
      queueEntry.errorHistory = [
        ...(queueEntry.errorHistory || []),
        { error: error.message, timestamp: new Date(), attempt: queueEntry.attempts },
      ];
      await this.queueRepository.save(queueEntry);

      throw error;
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<EmailJobData>) {
    this.logger.log(`Job ${job.id} completed for email ${job.data.emailId}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<EmailJobData>, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);

    const { emailId, queueId } = job.data;

    if (job.attemptsMade >= (job.opts.attempts || 5)) {
      await this.moveToDeadLetter(emailId, queueId, error.message);
    }
  }

  private async updateEmailStatus(
    email: Email,
    status: EmailStatus,
    error?: string,
  ): Promise<void> {
    email.status = status;
    if (error) {
      email.lastError = error;
    }
    await this.emailRepository.save(email);
  }

  private async updateQueueStatus(
    queueEntry: EmailQueue,
    status: QueueStatus,
  ): Promise<void> {
    queueEntry.status = status;
    if (status === QueueStatus.COMPLETED) {
      queueEntry.completedAt = new Date();
    }
    await this.queueRepository.save(queueEntry);
  }

  private async moveToDeadLetter(
    emailId: string,
    queueId: string,
    error: string,
  ): Promise<void> {
    this.logger.warn(`Moving email ${emailId} to dead letter queue`);

    await this.emailRepository.update(emailId, {
      status: EmailStatus.FAILED,
      lastError: `Max retries exceeded: ${error}`,
    });

    await this.queueRepository.update(queueId, {
      status: QueueStatus.DEAD_LETTER,
      lastError: `Max retries exceeded: ${error}`,
    });
  }
}
