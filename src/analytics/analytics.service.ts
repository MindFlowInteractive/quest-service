import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { TrackEventDto } from './dto/track-event.dto';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepo: Repository<AnalyticsEvent>,
  ) {}

  async trackEvent(dto: TrackEventDto): Promise<AnalyticsEvent> {
    const event = this.analyticsEventRepo.create({
      eventType: dto.eventType,
      payload: dto.metadata || {},
      userId: dto.playerId,
      sessionId: dto.sessionId,
    });
    return this.analyticsEventRepo.save(event);
  }

  async getPlayersOverview(filter: AnalyticsFilterDto) {
    const qb = this.analyticsEventRepo.createQueryBuilder('event');

    if (filter.from) {
      qb.andWhere('event.createdAt >= :from', { from: filter.from });
    }
    if (filter.to) {
      qb.andWhere('event.createdAt <= :to', { to: filter.to });
    }

    qb.select('COUNT(DISTINCT event.userId)', 'count');
    const result = await qb.getRawOne();

    return {
      totalPlayers: parseInt(result?.count || '0', 10),
    };
  }
}
