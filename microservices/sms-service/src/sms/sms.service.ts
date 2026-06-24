import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { Between, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { SmsProviderFactory } from '../providers/sms-provider.factory';
import { TemplatesService } from '../templates/templates.service';
import {
  DeliveryReceiptDto,
  GenerateOtpDto,
  SendSmsDto,
  SendTemplatedSmsDto,
  VerifyOtpDto,
} from './dto';
import { Message, MessageStatus, MessageType } from './entities/message.entity';
import { Receipt } from './entities/receipt.entity';
import { Sms } from './entities/sms.entity';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly rateLimits = new Map<string, number[]>();

  constructor(
    @InjectRepository(Sms)
    private readonly smsRepository: Repository<Sms>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    private readonly providerFactory: SmsProviderFactory,
    private readonly templatesService: TemplatesService,
    private readonly configService: ConfigService,
  ) {}

  async send(dto: SendSmsDto): Promise<Message> {
    this.assertPhoneAllowed(dto.toPhoneNumber);
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    const provider = this.providerFactory.getProvider();
    const fromNumber = this.resolveFromNumber(dto.fromNumber);

    const sender = await this.findOrCreateSender(provider.name, fromNumber);
    const message = this.messageRepository.create({
      ...dto,
      toPhoneNumber: this.normalizePhone(dto.toPhoneNumber),
      fromNumber,
      provider: provider.name,
      status:
        scheduledAt && scheduledAt > new Date()
          ? MessageStatus.SCHEDULED
          : MessageStatus.PENDING,
      scheduledAt,
      sender,
    });

    await this.messageRepository.save(message);

    if (message.status === MessageStatus.SCHEDULED) {
      return message;
    }

    return this.dispatch(message);
  }

  async sendTemplated(dto: SendTemplatedSmsDto): Promise<Message> {
    const body = this.templatesService.render(dto.templateName, dto.variables);

    const message = await this.send({
      toPhoneNumber: dto.toPhoneNumber,
      userId: dto.userId,
      fromNumber: dto.fromNumber,
      body,
      type: dto.type,
      priority: dto.priority,
      metadata: dto.metadata,
      scheduledAt: dto.scheduledAt,
    });

    message.templateName = dto.templateName;
    message.templateData = dto.variables;
    return this.messageRepository.save(message);
  }

  async generateOtp(
    dto: GenerateOtpDto,
  ): Promise<{ messageId: string; expiresAt: Date }> {
    const code = this.generateCode();
    const ttlSeconds = this.configService.get<number>('sms.otp.ttlSeconds');
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const minutes = Math.max(1, Math.ceil(ttlSeconds / 60));
    const templateName = dto.templateName || 'otp';
    const body = this.templatesService.render(templateName, {
      ...(dto.variables || {}),
      code,
      minutes,
    });

    const message = await this.send({
      toPhoneNumber: dto.toPhoneNumber,
      userId: dto.userId,
      body,
      type: MessageType.OTP,
      metadata: { purpose: 'otp' },
    });

    message.otpHash = this.hashOtp(dto.toPhoneNumber, code);
    message.otpExpiresAt = expiresAt;
    await this.messageRepository.save(message);

    return { messageId: message.id, expiresAt };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ valid: boolean; messageId?: string }> {
    const where: any = {
      toPhoneNumber: this.normalizePhone(dto.toPhoneNumber),
      type: MessageType.OTP,
      otpExpiresAt: MoreThan(new Date()),
    };

    if (dto.messageId) {
      where.id = dto.messageId;
    }

    const message = await this.messageRepository.findOne({
      where,
      order: { createdAt: 'DESC' },
    });

    if (!message || !message.otpHash) {
      return { valid: false };
    }

    if (message.otpAttempts >= 5) {
      throw new HttpException(
        'Maximum OTP verification attempts exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    message.otpAttempts += 1;
    const expected = Buffer.from(message.otpHash);
    const actual = Buffer.from(this.hashOtp(dto.toPhoneNumber, dto.code));
    const valid =
      expected.length === actual.length && timingSafeEqual(expected, actual);

    if (valid) {
      message.status = MessageStatus.DELIVERED;
      message.deliveredAt = message.deliveredAt || new Date();
      message.otpExpiresAt = new Date();
    }

    await this.messageRepository.save(message);
    return { valid, messageId: message.id };
  }

  async recordReceipt(dto: DeliveryReceiptDto): Promise<Receipt> {
    const message = await this.messageRepository.findOne({
      where: { providerMessageId: dto.providerMessageId },
    });

    if (!message) {
      throw new NotFoundException(`Message ${dto.providerMessageId} not found`);
    }

    const receipt = this.receiptRepository.create({
      messageId: message.id,
      provider: dto.provider || message.provider,
      providerMessageId: dto.providerMessageId,
      status: dto.status,
      errorCode: dto.errorCode,
      errorMessage: dto.errorMessage,
      rawPayload: dto.rawPayload,
    });

    this.applyStatus(message, dto.status, dto.errorMessage);
    await this.messageRepository.save(message);
    return this.receiptRepository.save(receipt);
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['receipts'],
    });

    if (!message) {
      throw new NotFoundException(`SMS message ${id} not found`);
    }

    return message;
  }

  async history(options: {
    userId?: string;
    phone?: string;
    status?: MessageStatus;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: Message[]; total: number }> {
    const where: any = {};

    if (options.userId) {
      where.userId = options.userId;
    }
    if (options.phone) {
      where.toPhoneNumber = this.normalizePhone(options.phone);
    }
    if (options.status) {
      where.status = options.status;
    }
    if (options.from && options.to) {
      where.createdAt = Between(options.from, options.to);
    }

    const [messages, total] = await this.messageRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: options.limit || 50,
      skip: options.offset || 0,
    });

    return { messages, total };
  }

  async analytics(options: { from?: Date; to?: Date; userId?: string }) {
    const query = this.messageRepository.createQueryBuilder('message');

    if (options.userId) {
      query.andWhere('message.userId = :userId', { userId: options.userId });
    }
    if (options.from && options.to) {
      query.andWhere('message.createdAt BETWEEN :from AND :to', {
        from: options.from,
        to: options.to,
      });
    }

    const stats = await query
      .select('message.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('message.status')
      .getRawMany();

    const count = (status: MessageStatus) =>
      parseInt(stats.find((item) => item.status === status)?.count || '0', 10);
    const total = stats.reduce(
      (sum, item) => sum + parseInt(item.count, 10),
      0,
    );
    const delivered = count(MessageStatus.DELIVERED);
    const sent = count(MessageStatus.SENT) + delivered;
    const failed =
      count(MessageStatus.FAILED) + count(MessageStatus.UNDELIVERED);

    return {
      total,
      sent,
      delivered,
      failed,
      scheduled: count(MessageStatus.SCHEDULED),
      pending: count(MessageStatus.PENDING),
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
    };
  }

  async cancel(id: string): Promise<Message> {
    const message = await this.findOne(id);
    if (
      ![MessageStatus.PENDING, MessageStatus.SCHEDULED].includes(message.status)
    ) {
      throw new BadRequestException(
        'Only pending or scheduled SMS messages can be cancelled',
      );
    }

    message.status = MessageStatus.CANCELLED;
    return this.messageRepository.save(message);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendScheduledMessages(): Promise<void> {
    const messages = await this.messageRepository.find({
      where: {
        status: MessageStatus.SCHEDULED,
        scheduledAt: LessThanOrEqual(new Date()),
      },
      take: 50,
    });

    for (const message of messages) {
      try {
        await this.dispatch(message);
      } catch (error) {
        this.logger.error(
          `Scheduled SMS ${message.id} failed: ${error.message}`,
        );
      }
    }
  }

  private async dispatch(message: Message): Promise<Message> {
    if (message.expiresAt && message.expiresAt < new Date()) {
      message.status = MessageStatus.EXPIRED;
      return this.messageRepository.save(message);
    }

    try {
      const provider = this.providerFactory.getProvider();
      const result = await provider.send({
        to: message.toPhoneNumber,
        from: message.fromNumber,
        body: message.body,
        metadata: message.metadata,
      });

      message.provider = result.provider;
      message.providerMessageId = result.messageId;
      message.status =
        result.status === 'queued' ? MessageStatus.PENDING : MessageStatus.SENT;
      message.sentAt = new Date();
      message.lastError = null;
    } catch (error) {
      message.status = MessageStatus.FAILED;
      message.failedAt = new Date();
      message.lastError = error.message;
    }

    return this.messageRepository.save(message);
  }

  private applyStatus(
    message: Message,
    status: MessageStatus,
    error?: string,
  ): void {
    message.status = status;
    if (status === MessageStatus.DELIVERED) {
      message.deliveredAt = new Date();
    }
    if ([MessageStatus.FAILED, MessageStatus.UNDELIVERED].includes(status)) {
      message.failedAt = new Date();
      message.lastError = error;
    }
  }

  private findOrCreateSender(
    provider: string,
    fromNumber: string,
  ): Promise<Sms> {
    return this.smsRepository.findOne({ where: { provider, fromNumber } }).then(
      (sender) =>
        sender ||
        this.smsRepository.save(
          this.smsRepository.create({
            provider,
            fromNumber,
            displayName: this.configService.get<string>('sms.defaultFrom'),
          }),
        ),
    );
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  private resolveFromNumber(fromNumber?: string): string {
    return (
      fromNumber ||
      this.configService.get<string>('sms.twilio.fromNumber') ||
      this.configService.get<string>('sms.defaultFrom')
    );
  }

  private assertPhoneAllowed(phone: string): void {
    const normalized = this.normalizePhone(phone);
    const now = Date.now();
    const windowMs =
      this.configService.get<number>('sms.rateLimit.windowSeconds') * 1000;
    const max = this.configService.get<number>('sms.rateLimit.max');
    const attempts = (this.rateLimits.get(normalized) || []).filter(
      (timestamp) => now - timestamp < windowMs,
    );

    if (attempts.length >= max) {
      throw new HttpException(
        'SMS rate limit exceeded for this phone number',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    attempts.push(now);
    this.rateLimits.set(normalized, attempts);
  }

  private generateCode(): string {
    const length = this.configService.get<number>('sms.otp.length');
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return randomInt(min, max).toString();
  }

  private hashOtp(phone: string, code: string): string {
    return createHash('sha256')
      .update(
        `${this.normalizePhone(phone)}:${code}:${process.env.OTP_SECRET || 'sms-service-dev-secret'}`,
      )
      .digest('hex');
  }
}
