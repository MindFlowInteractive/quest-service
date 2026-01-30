import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Email, EmailStatus, EmailType } from './entities/email.entity';
import { QueueService } from '../queue/queue.service';
import { TemplatesService } from '../templates/templates.service';
import { SendEmailDto, SendTemplatedEmailDto, SendBatchEmailDto } from './dto';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    private readonly queueService: QueueService,
    private readonly templatesService: TemplatesService,
    private readonly configService: ConfigService,
  ) {}

  async send(dto: SendEmailDto): Promise<Email> {
    const email = this.emailRepository.create({
      ...dto,
      fromEmail: dto.fromEmail || this.configService.get<string>('email.sendgrid.fromEmail'),
      fromName: dto.fromName || this.configService.get<string>('email.sendgrid.fromName'),
      status: EmailStatus.PENDING,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });

    await this.emailRepository.save(email);

    await this.queueService.addToQueue(email);

    this.logger.log(`Email queued for ${dto.toEmail} with ID ${email.id}`);
    return email;
  }

  async sendTemplated(dto: SendTemplatedEmailDto): Promise<Email> {
    const rendered = await this.templatesService.render({
      templateName: dto.templateName,
      variables: dto.variables,
    });

    const template = await this.templatesService.findByName(dto.templateName);

    const email = this.emailRepository.create({
      toEmail: dto.toEmail,
      toName: dto.toName,
      userId: dto.userId,
      subject: rendered.subject,
      htmlContent: rendered.html,
      textContent: rendered.text,
      templateId: template.id,
      templateData: dto.variables,
      fromEmail: dto.fromEmail || template.fromEmail || this.configService.get<string>('email.sendgrid.fromEmail'),
      fromName: dto.fromName || template.fromName || this.configService.get<string>('email.sendgrid.fromName'),
      replyTo: dto.replyTo || template.replyTo,
      priority: dto.priority,
      type: dto.type || EmailType.TRANSACTIONAL,
      headers: template.headers,
      attachments: dto.attachments,
      metadata: dto.metadata,
      status: EmailStatus.PENDING,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });

    await this.emailRepository.save(email);
    await this.queueService.addToQueue(email);

    this.logger.log(`Templated email queued for ${dto.toEmail} using template ${dto.templateName}`);
    return email;
  }

  async sendBatch(dto: SendBatchEmailDto): Promise<Email[]> {
    const emails: Email[] = [];

    for (const emailDto of dto.emails) {
      const email = await this.send(emailDto);
      emails.push(email);
    }

    return emails;
  }

  async findOne(id: string): Promise<Email> {
    const email = await this.emailRepository.findOne({ where: { id } });
    if (!email) {
      throw new NotFoundException(`Email with ID ${id} not found`);
    }
    return email;
  }

  async findByUserId(userId: string, options?: {
    status?: EmailStatus;
    type?: EmailType;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ emails: Email[]; total: number }> {
    const where: any = { userId };

    if (options?.status) {
      where.status = options.status;
    }
    if (options?.type) {
      where.type = options.type;
    }
    if (options?.from && options?.to) {
      where.createdAt = Between(options.from, options.to);
    }

    const [emails, total] = await this.emailRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return { emails, total };
  }

  async findByMessageId(messageId: string): Promise<Email> {
    const email = await this.emailRepository.findOne({ where: { messageId } });
    if (!email) {
      throw new NotFoundException(`Email with message ID ${messageId} not found`);
    }
    return email;
  }

  async updateStatus(id: string, status: EmailStatus, error?: string): Promise<Email> {
    const email = await this.findOne(id);
    email.status = status;

    if (error) {
      email.lastError = error;
    }

    switch (status) {
      case EmailStatus.SENT:
        email.sentAt = new Date();
        break;
      case EmailStatus.DELIVERED:
        email.deliveredAt = new Date();
        break;
      case EmailStatus.OPENED:
        email.openedAt = email.openedAt || new Date();
        email.openCount += 1;
        break;
      case EmailStatus.CLICKED:
        email.clickedAt = email.clickedAt || new Date();
        email.clickCount += 1;
        break;
      case EmailStatus.BOUNCED:
        email.bouncedAt = new Date();
        break;
      case EmailStatus.COMPLAINED:
        email.complainedAt = new Date();
        break;
    }

    return this.emailRepository.save(email);
  }

  async getStats(options?: {
    from?: Date;
    to?: Date;
    userId?: string;
    type?: EmailType;
  }): Promise<{
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    failed: number;
    pending: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  }> {
    const where: any = {};

    if (options?.from && options?.to) {
      where.createdAt = Between(options.from, options.to);
    }
    if (options?.userId) {
      where.userId = options.userId;
    }
    if (options?.type) {
      where.type = options.type;
    }

    const stats = await this.emailRepository
      .createQueryBuilder('email')
      .select('email.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(where)
      .groupBy('email.status')
      .getRawMany();

    const getCount = (status: EmailStatus) =>
      parseInt(stats.find((s) => s.status === status)?.count || '0');

    const total = stats.reduce((sum, s) => sum + parseInt(s.count), 0);
    const sent = getCount(EmailStatus.SENT) + getCount(EmailStatus.DELIVERED) +
                 getCount(EmailStatus.OPENED) + getCount(EmailStatus.CLICKED);
    const delivered = getCount(EmailStatus.DELIVERED) + getCount(EmailStatus.OPENED) +
                      getCount(EmailStatus.CLICKED);
    const opened = getCount(EmailStatus.OPENED) + getCount(EmailStatus.CLICKED);
    const clicked = getCount(EmailStatus.CLICKED);
    const bounced = getCount(EmailStatus.BOUNCED);
    const complained = getCount(EmailStatus.COMPLAINED);
    const failed = getCount(EmailStatus.FAILED);
    const pending = getCount(EmailStatus.PENDING) + getCount(EmailStatus.QUEUED);

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      pending,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
    };
  }

  async cancel(id: string): Promise<boolean> {
    const email = await this.findOne(id);

    if (email.status !== EmailStatus.PENDING && email.status !== EmailStatus.QUEUED) {
      return false;
    }

    email.status = EmailStatus.FAILED;
    email.lastError = 'Cancelled by user';
    await this.emailRepository.save(email);

    return true;
  }

  async retry(id: string): Promise<Email> {
    const email = await this.findOne(id);

    if (email.status !== EmailStatus.FAILED && email.status !== EmailStatus.BOUNCED) {
      throw new Error('Only failed or bounced emails can be retried');
    }

    email.status = EmailStatus.PENDING;
    email.retryCount += 1;
    await this.emailRepository.save(email);

    await this.queueService.addToQueue(email);

    return email;
  }
}
