import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  EmailTrackingEvent,
  TrackingEventType,
  BounceType,
} from './entities/email-tracking-event.entity';
import { EmailsService } from '../emails/emails.service';
import { EmailStatus } from '../emails/entities/email.entity';

export interface TrackingEventData {
  emailId: string;
  messageId?: string;
  userId?: string;
  provider?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  bounceType?: BounceType;
  bounceReason?: string;
  complaintType?: string;
  rawEvent?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(EmailTrackingEvent)
    private readonly trackingRepository: Repository<EmailTrackingEvent>,
    private readonly emailsService: EmailsService,
  ) {}

  async trackEvent(type: TrackingEventType, data: TrackingEventData): Promise<EmailTrackingEvent> {
    const event = this.trackingRepository.create({
      ...data,
      eventType: type,
    });

    await this.trackingRepository.save(event);

    await this.updateEmailStatus(type, data);

    this.logger.log(`Tracked ${type} event for email ${data.emailId}`);
    return event;
  }

  async trackDelivery(data: TrackingEventData): Promise<EmailTrackingEvent> {
    return this.trackEvent(TrackingEventType.DELIVERED, data);
  }

  async trackOpen(data: TrackingEventData): Promise<EmailTrackingEvent> {
    return this.trackEvent(TrackingEventType.OPENED, data);
  }

  async trackClick(data: TrackingEventData): Promise<EmailTrackingEvent> {
    return this.trackEvent(TrackingEventType.CLICKED, data);
  }

  async trackBounce(data: TrackingEventData): Promise<EmailTrackingEvent> {
    return this.trackEvent(TrackingEventType.BOUNCED, data);
  }

  async trackComplaint(data: TrackingEventData): Promise<EmailTrackingEvent> {
    return this.trackEvent(TrackingEventType.COMPLAINED, data);
  }

  async trackUnsubscribe(data: TrackingEventData): Promise<EmailTrackingEvent> {
    return this.trackEvent(TrackingEventType.UNSUBSCRIBED, data);
  }

  async getEventsByEmail(emailId: string): Promise<EmailTrackingEvent[]> {
    return this.trackingRepository.find({
      where: { emailId },
      order: { createdAt: 'ASC' },
    });
  }

  async getEventsByUser(userId: string, options?: {
    type?: TrackingEventType;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: EmailTrackingEvent[]; total: number }> {
    const where: any = { userId };

    if (options?.type) {
      where.eventType = options.type;
    }
    if (options?.from && options?.to) {
      where.createdAt = Between(options.from, options.to);
    }

    const [events, total] = await this.trackingRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return { events, total };
  }

  async getStats(options?: {
    from?: Date;
    to?: Date;
    provider?: string;
  }): Promise<Record<TrackingEventType, number>> {
    const query = this.trackingRepository.createQueryBuilder('event')
      .select('event.eventType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.eventType');

    if (options?.from && options?.to) {
      query.andWhere('event.createdAt BETWEEN :from AND :to', {
        from: options.from,
        to: options.to,
      });
    }
    if (options?.provider) {
      query.andWhere('event.provider = :provider', { provider: options.provider });
    }

    const results = await query.getRawMany();

    const stats: Partial<Record<TrackingEventType, number>> = {};
    for (const type of Object.values(TrackingEventType)) {
      stats[type] = parseInt(results.find((r) => r.type === type)?.count || '0');
    }

    return stats as Record<TrackingEventType, number>;
  }

  async getBounceStats(from?: Date, to?: Date): Promise<Record<BounceType, number>> {
    const query = this.trackingRepository.createQueryBuilder('event')
      .select('event.bounceType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('event.eventType = :eventType', { eventType: TrackingEventType.BOUNCED })
      .groupBy('event.bounceType');

    if (from && to) {
      query.andWhere('event.createdAt BETWEEN :from AND :to', { from, to });
    }

    const results = await query.getRawMany();

    return {
      [BounceType.HARD]: parseInt(results.find((r) => r.type === BounceType.HARD)?.count || '0'),
      [BounceType.SOFT]: parseInt(results.find((r) => r.type === BounceType.SOFT)?.count || '0'),
      [BounceType.TRANSIENT]: parseInt(results.find((r) => r.type === BounceType.TRANSIENT)?.count || '0'),
    };
  }

  private async updateEmailStatus(type: TrackingEventType, data: TrackingEventData): Promise<void> {
    const statusMap: Partial<Record<TrackingEventType, EmailStatus>> = {
      [TrackingEventType.DELIVERED]: EmailStatus.DELIVERED,
      [TrackingEventType.OPENED]: EmailStatus.OPENED,
      [TrackingEventType.CLICKED]: EmailStatus.CLICKED,
      [TrackingEventType.BOUNCED]: EmailStatus.BOUNCED,
      [TrackingEventType.COMPLAINED]: EmailStatus.COMPLAINED,
    };

    const status = statusMap[type];
    if (status) {
      try {
        await this.emailsService.updateStatus(data.emailId, status);
      } catch (error) {
        this.logger.warn(`Failed to update email status: ${error.message}`);
      }
    }
  }
}
