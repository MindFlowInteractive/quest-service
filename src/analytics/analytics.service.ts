import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlayerEvent } from './entities/player-event.entity';
import { PuzzleAttempt } from './entities/puzzle-attempt.entity';
import { RevenueEvent } from './entities/revenue-event.entity';
import { ABTestResult } from './entities/abtest-result.entity';
import { CustomEvent } from './entities/custom-event.entity';


import { FilterPlayerBehaviorDto } from './dto/filter-player-behavior.dto';
import { FilterPuzzlePerformanceDto } from './dto/filter-puzzle-performance.dto';
import { FilterEngagementDto } from './dto/filter-engagement.dto';
import { FilterRevenueDto } from './dto/filter-revenue.dto';
import { FilterABTestDto } from './dto/filter-abtest.dto';
import { FilterCustomEventDto } from './dto/filter-custom-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PlayerEvent)
    private readonly playerEventRepo: Repository<PlayerEvent>,

    @InjectRepository(PuzzleAttempt)
    private readonly puzzleAttemptRepo: Repository<PuzzleAttempt>,

    @InjectRepository(RevenueEvent)
    private readonly revenueEventRepo: Repository<RevenueEvent>,

    @InjectRepository(ABTestResult)
    private readonly abTestResultRepo: Repository<ABTestResult>,

    @InjectRepository(CustomEvent)
    private readonly customEventRepo: Repository<CustomEvent>,
  ) {}

  /**
   * 1. Player Behavior Analytics
   */
  async getPlayerBehaviorAnalytics(filters: FilterPlayerBehaviorDto) {
    const qb = this.playerEventRepo.createQueryBuilder('event');

    if (filters.playerId) qb.andWhere('event.playerId = :playerId', { playerId: filters.playerId });
    if (filters.startDate) qb.andWhere('event.timestamp >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('event.timestamp <= :endDate', { endDate: filters.endDate });
    if (filters.eventType) qb.andWhere('event.type = :eventType', { eventType: filters.eventType });

    const results = await qb
      .select([
        'event.type as eventType',
        'COUNT(event.id) as totalEvents',
        'AVG(event.sessionDuration) as avgSessionDuration',
      ])
      .groupBy('event.type')
      .getRawMany();

    return { summary: results, filters };
  }

  /**
   * 2. Puzzle Performance & Difficulty Analytics
   */
  async getPuzzlePerformanceAnalytics(filters: FilterPuzzlePerformanceDto) {
    const qb = this.puzzleAttemptRepo.createQueryBuilder('attempt');

    if (filters.puzzleId) qb.andWhere('attempt.puzzleId = :puzzleId', { puzzleId: filters.puzzleId });
    if (filters.difficulty) qb.andWhere('attempt.difficulty = :difficulty', { difficulty: filters.difficulty });
    if (filters.startDate) qb.andWhere('attempt.timestamp >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('attempt.timestamp <= :endDate', { endDate: filters.endDate });

    const results = await qb
      .select([
        'attempt.puzzleId as puzzleId',
        'attempt.difficulty as difficulty',
        'COUNT(attempt.id) as attempts',
        'SUM(CASE WHEN attempt.success = true THEN 1 ELSE 0 END) as successCount',
        'AVG(attempt.timeTaken) as avgTimeTaken',
      ])
      .groupBy('attempt.puzzleId')
      .addGroupBy('attempt.difficulty')
      .getRawMany();

    return { summary: results, filters };
  }

  /**
   * 3. Engagement & Retention Analytics
   */
  async getEngagementAnalytics(filters: FilterEngagementDto) {
    const qb = this.playerEventRepo.createQueryBuilder('event');

    if (filters.startDate) qb.andWhere('event.timestamp >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('event.timestamp <= :endDate', { endDate: filters.endDate });

    // Example: Daily Active Users, Retention
    const results = await qb
      .select([
        'DATE(event.timestamp) as day',
        'COUNT(DISTINCT event.playerId) as activeUsers',
      ])
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return { engagement: results, filters };
  }

  /**
   * 4. Revenue & Monetization Analytics
   */
  async getRevenueAnalytics(filters: FilterRevenueDto) {
    const qb = this.revenueEventRepo.createQueryBuilder('rev');

    if (filters.startDate) qb.andWhere('rev.timestamp >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('rev.timestamp <= :endDate', { endDate: filters.endDate });
    if (filters.revenueType) qb.andWhere('rev.type = :revenueType', { revenueType: filters.revenueType });

    const results = await qb
      .select([
        'rev.type as revenueType',
        'SUM(rev.amount) as totalRevenue',
        'COUNT(rev.id) as transactions',
        'AVG(rev.amount) as avgRevenuePerTxn',
      ])
      .groupBy('rev.type')
      .getRawMany();

    return { revenue: results, filters };
  }

  /**
   * 5. A/B Testing Results & Statistical Analysis
   */
  async getABTestResults(filters: FilterABTestDto) {
    const qb = this.abTestResultRepo.createQueryBuilder('ab');

    if (filters.testId) qb.andWhere('ab.testId = :testId', { testId: filters.testId });

    const results = await qb
      .select([
        'ab.variant as variant',
        'COUNT(ab.id) as participants',
        'AVG(ab.metricValue) as avgMetric',
      ])
      .groupBy('ab.variant')
      .getRawMany();

    // Example: add simple significance calculation placeholder
    return { abTestResults: results, filters, significance: 'TODO: Implement statistical test' };
  }

  /**
   * 6. Custom Event Tracking & Funnel Analysis
   */
  async getFunnelAnalytics(filters: FilterCustomEventDto) {
    const qb = this.customEventRepo.createQueryBuilder('evt');

    if (filters.funnelId) qb.andWhere('evt.funnelId = :funnelId', { funnelId: filters.funnelId });

    const results = await qb
      .select([
        'evt.step as step',
        'COUNT(evt.id) as stepCount',
      ])
      .groupBy('evt.step')
      .orderBy('evt.step', 'ASC')
      .getRawMany();

    return { funnel: results, filters };
  }

  /**
   * 7. Real-Time Dashboard Data
   */
  async getRealTimeDashboard() {
    const recentEvents = await this.playerEventRepo
      .createQueryBuilder('event')
      .orderBy('event.timestamp', 'DESC')
      .limit(20)
      .getMany();

    return { latestEvents: recentEvents, serverTime: new Date().toISOString() };
  }

  /**
   * 8. Predictive Analytics & Forecasting
   * (Placeholder – would integrate with ML model/service)
   */
  async getForecastAnalytics(metric: string) {
    // TODO: Replace with ML model or external forecast service
    return {
      metric,
      forecast: [
        { date: '2025-10-01', predictedValue: 120 },
        { date: '2025-10-02', predictedValue: 135 },
        { date: '2025-10-03', predictedValue: 142 },
      ],
    };
  }

  /**
   * 9. Data Export / Integration
   */
  async exportAnalyticsData(type: string) {
    // Example: Return CSV/JSON export payload
    return {
      type,
      url: `/exports/analytics-${type}-${Date.now()}.csv`,
      status: 'ready',
    };
  }

  /**
   * 10. Visualization-Ready Chart Data
   */
  async getChartData(metric: string) {
    const qb = this.playerEventRepo.createQueryBuilder('event');

    const results = await qb
      .select([
        'DATE(event.timestamp) as day',
        'COUNT(event.id) as count',
      ])
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      metric,
      labels: results.map(r => r.day),
      datasets: [{ label: metric, data: results.map(r => parseInt(r.count, 10)) }],
    };
  }
}
