import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsProviderFactory } from '../providers/sms-provider.factory';
import { ReceiptsService } from '../receipts/receipts.service';
import { TemplatesService } from '../templates/templates.service';
import { QuerySmsHistoryDto, SendSmsDto, SendTemplatedSmsDto } from './dto';
import {
  SmsMessage,
  SmsMessageStatus,
  SmsMessageType,
  SmsPriority,
} from './entities/sms-message.entity';
import { PhoneNumberService } from './phone-number.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private processingDueMessages = false;

  constructor(
    @InjectRepository(SmsMessage)
    private readonly messageRepository: Repository<SmsMessage>,
    private readonly providers: SmsProviderFactory,
    private readonly receiptsService: ReceiptsService,
    private readonly templatesService: TemplatesService,
    private readonly phoneNumberService: PhoneNumberService,
    private readonly configService: ConfigService,
  ) {}

  async send(dto: SendSmsDto): Promise<SmsMessage> {
    const normalized = this.phoneNumberService.normalize(dto.phoneNumber);
    await this.enforceRateLimit(normalized.e164);

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    if (scheduledAt && expiresAt && scheduledAt > expiresAt) {
      throw new BadRequestException('scheduledAt must be before expiresAt');
    }

    const message = this.messageRepository.create({
      userId: dto.userId,
      phoneNumber: dto.phoneNumber,
      normalizedPhoneNumber: normalized.e164,
      countryCode: normalized.country,
      body: dto.body,
      type: dto.type || SmsMessageType.TRANSACTIONAL,
      priority: dto.priority || SmsPriority.NORMAL,
      metadata: dto.metadata,
      correlationId: dto.correlationId,
      otpPurpose: dto.otpPurpose,
      status:
        scheduledAt && scheduledAt.getTime() > Date.now()
          ? SmsMessageStatus.QUEUED
          : SmsMessageStatus.PENDING,
      scheduledAt,
      expiresAt,
      segments: this.estimateSegments(dto.body),
      maxAttempts:
        dto.maxAttempts ||
        this.configService.get<number>('sms.dispatch.maxRetries', 3),
    });

    const saved = await this.messageRepository.save(message);
    return this.maybeDispatch(saved);
  }

  async sendTemplated(dto: SendTemplatedSmsDto): Promise<SmsMessage> {
    const template = await this.templatesService.findByName(dto.templateName);
    const rendered = await this.templatesService.render({
      templateName: dto.templateName,
      variables: dto.variables,
    });

    return this.send({
      phoneNumber: dto.phoneNumber,
      body: rendered.body,
      userId: dto.userId,
      type: dto.type,
      priority: dto.priority,
      metadata: dto.metadata,
      correlationId: dto.correlationId,
      scheduledAt: dto.scheduledAt,
      expiresAt: dto.expiresAt,
    }).then(async (message) => {
      message.templateId = template.id;
      message.templateName = template.name;
      message.templateData = dto.variables;
      await this.messageRepository.save(message);
      return message;
    });
  }

  async findOne(id: string): Promise<SmsMessage> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`SMS message with ID ${id} not found`);
    }
    return message;
  }

  async getHistory(dto: QuerySmsHistoryDto) {
    const query = this.messageRepository.createQueryBuilder('sms');

    if (dto.userId) {
      query.andWhere('sms.userId = :userId', { userId: dto.userId });
    }

    if (dto.phoneNumber) {
      const normalized = this.phoneNumberService.normalize(dto.phoneNumber);
      query.andWhere('sms.normalizedPhoneNumber = :phone', {
        phone: normalized.e164,
      });
    }

    if (dto.status) {
      query.andWhere('sms.status = :status', { status: dto.status });
    }

    if (dto.type) {
      query.andWhere('sms.type = :type', { type: dto.type });
    }

    if (dto.provider) {
      query.andWhere('sms.provider = :provider', { provider: dto.provider });
    }

    if (dto.from) {
      query.andWhere('sms.createdAt >= :from', { from: new Date(dto.from) });
    }

    if (dto.to) {
      query.andWhere('sms.createdAt <= :to', { to: new Date(dto.to) });
    }

    const [messages, total] = await query
      .orderBy('sms.createdAt', 'DESC')
      .take(dto.limit || 50)
      .skip(dto.offset || 0)
      .getManyAndCount();

    return { messages, total };
  }

  async getStats(filters?: {
    from?: string;
    to?: string;
    userId?: string;
    type?: SmsMessageType;
  }) {
    const query = this.messageRepository.createQueryBuilder('sms');

    if (filters?.from) {
      query.andWhere('sms.createdAt >= :from', { from: new Date(filters.from) });
    }
    if (filters?.to) {
      query.andWhere('sms.createdAt <= :to', { to: new Date(filters.to) });
    }
    if (filters?.userId) {
      query.andWhere('sms.userId = :userId', { userId: filters.userId });
    }
    if (filters?.type) {
      query.andWhere('sms.type = :type', { type: filters.type });
    }

    const rows = await query
      .select('sms.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sms.status')
      .getRawMany();

    const getCount = (status: SmsMessageStatus) =>
      parseInt(rows.find((row) => row.status === status)?.count || '0', 10);

    const total = rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0);
    const sent = getCount(SmsMessageStatus.SENT) + getCount(SmsMessageStatus.DELIVERED);
    const delivered = getCount(SmsMessageStatus.DELIVERED);
    const failed = getCount(SmsMessageStatus.FAILED);
    const queued =
      getCount(SmsMessageStatus.QUEUED) + getCount(SmsMessageStatus.PENDING);

    return {
      total,
      sent,
      delivered,
      failed,
      queued,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
    };
  }

  async cancel(id: string) {
    const message = await this.findOne(id);

    if (
      ![SmsMessageStatus.PENDING, SmsMessageStatus.QUEUED].includes(message.status)
    ) {
      return { success: false };
    }

    message.status = SmsMessageStatus.CANCELLED;
    message.cancelledAt = new Date();
    await this.messageRepository.save(message);

    return { success: true };
  }

  async retry(id: string): Promise<SmsMessage> {
    const message = await this.findOne(id);

    if (
      ![SmsMessageStatus.FAILED, SmsMessageStatus.EXPIRED].includes(message.status)
    ) {
      throw new BadRequestException('Only failed or expired messages can be retried');
    }

    message.status = SmsMessageStatus.QUEUED;
    message.lastError = null;
    message.failedAt = null;
    message.nextRetryAt = new Date();

    await this.messageRepository.save(message);
    return this.dispatchMessage(message.id);
  }

  async dispatchMessage(id: string): Promise<SmsMessage> {
    const message = await this.findOne(id);
    return this.dispatch(message);
  }

  async processDueMessages(): Promise<number> {
    if (this.processingDueMessages) {
      return 0;
    }

    this.processingDueMessages = true;

    try {
      const now = new Date();
      const batchSize = this.configService.get<number>('sms.dispatch.batchSize', 25);

      const messages = await this.messageRepository
        .createQueryBuilder('sms')
        .where('sms.status IN (:...statuses)', {
          statuses: [SmsMessageStatus.PENDING, SmsMessageStatus.QUEUED],
        })
        .andWhere('(sms.scheduledAt IS NULL OR sms.scheduledAt <= :now)', { now })
        .andWhere('(sms.nextRetryAt IS NULL OR sms.nextRetryAt <= :now)', { now })
        .orderBy('sms.createdAt', 'ASC')
        .take(batchSize)
        .getMany();

      for (const message of messages) {
        await this.dispatch(message);
      }

      return messages.length;
    } finally {
      this.processingDueMessages = false;
    }
  }

  private async maybeDispatch(message: SmsMessage): Promise<SmsMessage> {
    if (
      message.status === SmsMessageStatus.QUEUED &&
      message.scheduledAt &&
      message.scheduledAt.getTime() > Date.now()
    ) {
      return message;
    }

    return this.dispatch(message);
  }

  private async dispatch(message: SmsMessage): Promise<SmsMessage> {
    if (
      [
        SmsMessageStatus.CANCELLED,
        SmsMessageStatus.DELIVERED,
        SmsMessageStatus.PROCESSING,
      ].includes(message.status)
    ) {
      return message;
    }

    if (message.expiresAt && message.expiresAt.getTime() < Date.now()) {
      message.status = SmsMessageStatus.EXPIRED;
      message.failedAt = new Date();
      message.lastError = 'Message expired before dispatch';
      return this.messageRepository.save(message);
    }

    if (message.scheduledAt && message.scheduledAt.getTime() > Date.now()) {
      message.status = SmsMessageStatus.QUEUED;
      return this.messageRepository.save(message);
    }

    if (message.nextRetryAt && message.nextRetryAt.getTime() > Date.now()) {
      return message;
    }

    message.status = SmsMessageStatus.PROCESSING;
    await this.messageRepository.save(message);

    const result = await this.providers.send({
      to: message.normalizedPhoneNumber,
      body: message.body,
      from: this.configService.get<string>('sms.senderId'),
      metadata: message.metadata,
      statusCallbackUrl: this.configService.get<string>('sms.statusCallbackUrl'),
    });

    message.attempts += 1;
    message.provider = result.provider;
    message.providerMessageId = result.messageId || message.providerMessageId;

    if (result.success) {
      message.status =
        result.deliveryStatus === 'delivered'
          ? SmsMessageStatus.DELIVERED
          : SmsMessageStatus.SENT;
      message.sentAt = message.sentAt || new Date();
      if (message.status === SmsMessageStatus.DELIVERED) {
        message.deliveredAt = new Date();
      }
      message.lastError = null;
      message.nextRetryAt = null;
      message.segments = result.segments || this.estimateSegments(message.body);
      message.estimatedCost = this.estimateCost(message.segments);

      const saved = await this.messageRepository.save(message);
      await this.receiptsService.recordProviderResult(saved, result);
      return saved;
    }

    return this.handleDispatchFailure(
      message,
      result.error || 'Provider send failed',
      result.provider,
    );
  }

  private async handleDispatchFailure(
    message: SmsMessage,
    error: string,
    provider?: string,
  ): Promise<SmsMessage> {
    message.provider = provider || message.provider;
    message.lastError = error;

    if (message.attempts >= message.maxAttempts) {
      message.status = SmsMessageStatus.FAILED;
      message.failedAt = new Date();
      message.nextRetryAt = null;
    } else {
      const delay = this.configService.get<number>(
        'sms.dispatch.retryBaseDelayMs',
        60000,
      );
      message.status = SmsMessageStatus.QUEUED;
      message.nextRetryAt = new Date(
        Date.now() + delay * Math.pow(2, Math.max(0, message.attempts - 1)),
      );
    }

    const saved = await this.messageRepository.save(message);
    await this.receiptsService.recordFailure(saved, error, provider);
    this.logger.warn(`SMS ${message.id} failed: ${error}`);
    return saved;
  }

  private async enforceRateLimit(normalizedPhoneNumber: string) {
    const windowMinutes = this.configService.get<number>(
      'sms.rateLimit.windowMinutes',
      10,
    );
    const maxPerWindow = this.configService.get<number>(
      'sms.rateLimit.maxPerWindow',
      20,
    );

    const threshold = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recentCount = await this.messageRepository
      .createQueryBuilder('sms')
      .where('sms.normalizedPhoneNumber = :phone', { phone: normalizedPhoneNumber })
      .andWhere('sms.createdAt >= :threshold', { threshold })
      .getCount();

    if (recentCount >= maxPerWindow) {
      throw new HttpException(
        'SMS rate limit exceeded for this phone number',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private estimateSegments(body: string): number {
    return Math.max(1, Math.ceil(body.length / 160));
  }

  private estimateCost(segments: number): number {
    return parseFloat((segments * 0.05).toFixed(2));
  }
}
