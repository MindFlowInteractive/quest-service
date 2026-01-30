import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  EmailUnsubscribe,
  EmailCategory,
  UnsubscribeReason,
} from './entities/email-unsubscribe.entity';
import { EmailType } from '../emails/entities/email.entity';
import { CreateUnsubscribeDto, ResubscribeDto } from './dto';

@Injectable()
export class UnsubscribeService {
  private readonly logger = new Logger(UnsubscribeService.name);

  constructor(
    @InjectRepository(EmailUnsubscribe)
    private readonly unsubscribeRepository: Repository<EmailUnsubscribe>,
    private readonly configService: ConfigService,
  ) {}

  async unsubscribe(dto: CreateUnsubscribeDto, request?: { ip?: string; userAgent?: string }): Promise<EmailUnsubscribe> {
    const existing = await this.unsubscribeRepository.findOne({
      where: {
        email: dto.email.toLowerCase(),
        category: dto.category || EmailCategory.ALL,
      },
    });

    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.resubscribedAt = null;
        return this.unsubscribeRepository.save(existing);
      }
      return existing;
    }

    const unsubscribe = this.unsubscribeRepository.create({
      email: dto.email.toLowerCase(),
      userId: dto.userId,
      category: dto.category || EmailCategory.ALL,
      reason: dto.reason || UnsubscribeReason.USER_REQUEST,
      unsubscribeToken: this.generateToken(dto.email),
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
    });

    await this.unsubscribeRepository.save(unsubscribe);

    this.logger.log(`User ${dto.email} unsubscribed from ${dto.category || 'ALL'} emails`);
    return unsubscribe;
  }

  async unsubscribeByToken(token: string, category?: EmailCategory): Promise<EmailUnsubscribe> {
    const decoded = this.decodeToken(token);
    if (!decoded) {
      throw new NotFoundException('Invalid or expired unsubscribe token');
    }

    return this.unsubscribe({
      email: decoded.email,
      category: category || EmailCategory.ALL,
      reason: UnsubscribeReason.USER_REQUEST,
    });
  }

  async resubscribe(dto: ResubscribeDto): Promise<boolean> {
    const result = await this.unsubscribeRepository.update(
      {
        email: dto.email.toLowerCase(),
        category: dto.category || EmailCategory.ALL,
        isActive: true,
      },
      {
        isActive: false,
        resubscribedAt: new Date(),
      },
    );

    if (result.affected > 0) {
      this.logger.log(`User ${dto.email} resubscribed to ${dto.category || 'ALL'} emails`);
      return true;
    }

    return false;
  }

  async isUnsubscribed(email: string, emailType: EmailType | string): Promise<boolean> {
    const category = this.mapEmailTypeToCategory(emailType);

    const unsubscribes = await this.unsubscribeRepository.find({
      where: [
        { email: email.toLowerCase(), category: EmailCategory.ALL, isActive: true },
        { email: email.toLowerCase(), category, isActive: true },
      ],
    });

    return unsubscribes.length > 0;
  }

  async getUnsubscribeStatus(email: string): Promise<{
    isUnsubscribed: boolean;
    categories: EmailCategory[];
  }> {
    const unsubscribes = await this.unsubscribeRepository.find({
      where: { email: email.toLowerCase(), isActive: true },
    });

    return {
      isUnsubscribed: unsubscribes.length > 0,
      categories: unsubscribes.map((u) => u.category),
    };
  }

  async getByUserId(userId: string): Promise<EmailUnsubscribe[]> {
    return this.unsubscribeRepository.find({
      where: { userId, isActive: true },
    });
  }

  async generateUnsubscribeLink(email: string, userId?: string): Promise<string> {
    const token = this.generateToken(email);
    const baseUrl = this.configService.get<string>('email.unsubscribe.baseUrl');

    if (userId) {
      await this.unsubscribeRepository.update(
        { email: email.toLowerCase() },
        { unsubscribeToken: token },
      );
    }

    return `${baseUrl}?token=${encodeURIComponent(token)}`;
  }

  async addBounce(email: string, reason?: string): Promise<EmailUnsubscribe> {
    return this.unsubscribe({
      email,
      reason: UnsubscribeReason.BOUNCE,
    }, undefined);
  }

  async addComplaint(email: string, reason?: string): Promise<EmailUnsubscribe> {
    return this.unsubscribe({
      email,
      reason: UnsubscribeReason.COMPLAINT,
    }, undefined);
  }

  async getBounces(from?: Date, to?: Date): Promise<EmailUnsubscribe[]> {
    const query = this.unsubscribeRepository.createQueryBuilder('unsub')
      .where('unsub.reason = :reason', { reason: UnsubscribeReason.BOUNCE });

    if (from) {
      query.andWhere('unsub.createdAt >= :from', { from });
    }
    if (to) {
      query.andWhere('unsub.createdAt <= :to', { to });
    }

    return query.getMany();
  }

  async getComplaints(from?: Date, to?: Date): Promise<EmailUnsubscribe[]> {
    const query = this.unsubscribeRepository.createQueryBuilder('unsub')
      .where('unsub.reason = :reason', { reason: UnsubscribeReason.COMPLAINT });

    if (from) {
      query.andWhere('unsub.createdAt >= :from', { from });
    }
    if (to) {
      query.andWhere('unsub.createdAt <= :to', { to });
    }

    return query.getMany();
  }

  private generateToken(email: string): string {
    const data = JSON.stringify({
      email: email.toLowerCase(),
      timestamp: Date.now(),
    });

    const secret = this.configService.get<string>('email.webhook.secret', 'default-secret');
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      crypto.scryptSync(secret, 'salt', 32),
      Buffer.alloc(16, 0),
    );

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
  }

  private decodeToken(token: string): { email: string; timestamp: number } | null {
    try {
      const secret = this.configService.get<string>('email.webhook.secret', 'default-secret');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        crypto.scryptSync(secret, 'salt', 32),
        Buffer.alloc(16, 0),
      );

      let decrypted = decipher.update(token, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      const data = JSON.parse(decrypted);

      const expiryDays = parseInt(
        this.configService.get<string>('email.unsubscribe.tokenExpiry', '30d').replace('d', ''),
      );
      const expiryMs = expiryDays * 24 * 60 * 60 * 1000;

      if (Date.now() - data.timestamp > expiryMs) {
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  private mapEmailTypeToCategory(emailType: EmailType | string): EmailCategory {
    switch (emailType) {
      case EmailType.MARKETING:
        return EmailCategory.MARKETING;
      case EmailType.NEWSLETTER:
        return EmailCategory.NEWSLETTER;
      case EmailType.NOTIFICATION:
        return EmailCategory.NOTIFICATIONS;
      case EmailType.TRANSACTIONAL:
      case EmailType.SYSTEM:
        return EmailCategory.TRANSACTIONAL;
      default:
        return EmailCategory.ALL;
    }
  }
}
