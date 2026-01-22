import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AnalyticsEvent } from './entities/analytics-event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepo: Repository<AnalyticsEvent>,
  ) { }

  /**
   * 1. Player Behavior Analytics
   */
  /**
   * 1. Player Behavior Analytics
   */
  async getPlayerBehaviorAnalytics(filters: any) {
    const qb = this.eventRepo.createQueryBuilder('event');

    if (filters.playerId) qb.andWhere('event.userId = :playerId', { playerId: filters.playerId });
    if (filters.startDate) qb.andWhere('event.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('event.createdAt <= :endDate', { endDate: filters.endDate });
    if (filters.eventType) qb.andWhere('event.eventType = :eventType', { eventType: filters.eventType });

    const results = await qb
      .select([
        'event.eventType as eventType',
        'COUNT(event.id) as totalEvents',
      ])
      .groupBy('event.eventType')
      .getRawMany();

    return { summary: results, filters };
  }

  /**
   * 2. Puzzle Performance & Difficulty Analytics
   */
  async getPuzzlePerformanceAnalytics(filters: any) {
    const qb = this.eventRepo.createQueryBuilder('event');

    qb.andWhere('event.eventType = :type', { type: 'puzzle_attempt' });
    if (filters.puzzleId) qb.andWhere("event.payload->>'puzzleId' = :puzzleId", { puzzleId: filters.puzzleId });
    if (filters.startDate) qb.andWhere('event.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('event.createdAt <= :endDate', { endDate: filters.endDate });

    const results = await qb
      .select([
        "event.payload->>'puzzleId' as puzzleId",
        'COUNT(event.id) as attempts',
      ])
      .groupBy("event.payload->>'puzzleId'")
      .getRawMany();

    return { summary: results, filters };
  }

  /**
   * 3. Engagement & Retention Analytics
   */
  async getEngagementAnalytics(filters: any) {
    const qb = this.eventRepo.createQueryBuilder('event');

    if (filters.startDate) qb.andWhere('event.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('event.createdAt <= :endDate', { endDate: filters.endDate });

    const results = await qb
      .select([
        'DATE(event.createdAt) as day',
        'COUNT(DISTINCT event.userId) as activeUsers',
      ])
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return { engagement: results, filters };
  }

  /**
   * 4. Revenue & Monetization Analytics
   */
  async getRevenueAnalytics(filters: any) {
    const qb = this.eventRepo.createQueryBuilder('event');
    qb.andWhere('event.eventType = :type', { type: 'revenue' });

    if (filters.startDate) qb.andWhere('event.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('event.createdAt <= :endDate', { endDate: filters.endDate });

    const results = await qb
      .select([
        "event.payload->>'type' as revenueType",
        'SUM(CAST(event.payload->>\'amount\' AS DECIMAL)) as totalRevenue',
      ])
      .groupBy("event.payload->>'type'")
      .getRawMany();

    return { revenue: results, filters };
  }

  /**
   * 5. A/B Testing Results & Statistical Analysis
   */
  async getABTestResults(filters: any) {
    const qb = this.eventRepo.createQueryBuilder('event');
    qb.andWhere('event.eventType = :type', { type: 'ab_test' });

    if (filters.testId) qb.andWhere("event.payload->>'testId' = :testId", { testId: filters.testId });

    const results = await qb
      .select([
        "event.payload->>'variant' as variant",
        'COUNT(event.id) as participants',
      ])
      .groupBy("event.payload->>'variant'")
      .getRawMany();

    return { abTestResults: results, filters };
  }

  /**
   * 6. Custom Event Tracking & Funnel Analysis
   */
  async getFunnelAnalytics(filters: any) {
    const qb = this.eventRepo.createQueryBuilder('event');
    qb.andWhere('event.eventType = :type', { type: 'funnel' });

    if (filters.funnelId) qb.andWhere("event.payload->>'funnelId' = :funnelId", { funnelId: filters.funnelId });

    const results = await qb
      .select([
        "event.payload->>'step' as step",
        'COUNT(event.id) as stepCount',
      ])
      .groupBy("event.payload->>'step'")
      .orderBy("event.payload->>'step'", 'ASC')
      .getRawMany();

    return { funnel: results, filters };
  }

  /**
   * 7. Real-Time Dashboard Data
   */
  async getRealTimeDashboard() {
    const recentEvents = await this.eventRepo
      .createQueryBuilder('event')
      .orderBy('event.createdAt', 'DESC')
      .limit(20)
      .getMany();

    return { latestEvents: recentEvents, serverTime: new Date().toISOString() };
  }

  /**
   * 8. Predictive Analytics & Forecasting
   */
  async getForecastAnalytics(metric: string) {
    return {
      metric,
      forecast: [
        { date: '2025-10-01', predictedValue: 120 },
      ],
    };
  }

  /**
   * 9. Data Export / Integration
   */
  async exportAnalyticsData(type: string) {
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
    const qb = this.eventRepo.createQueryBuilder('event');

    const results = await qb
      .select([
        'DATE(event.createdAt) as day',
        'COUNT(event.id) as count',
      ])
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      metric,
      labels: results.map((r: any) => r.day),
      datasets: [{ label: metric, data: results.map((r: any) => parseInt(r.count, 10)) }],
    };
  }

  /**
   * 11. Custom Overview Methods for Dashboard
   */
  async getPlayersOverview(filters: any) {
    const qb = this.eventRepo.createQueryBuilder('event');
    if (filters.from) qb.andWhere('event.createdAt >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('event.createdAt <= :to', { to: filters.to });

    const totalPlayers = await qb.select('COUNT(DISTINCT event.userId)', 'count').getRawOne();
    const newPlayers = await qb.andWhere('event.eventType = :type', { type: 'registration' }).select('COUNT(event.id)', 'count').getRawOne();

    return {
      totalPlayers: parseInt(totalPlayers?.count || '0', 10),
      newPlayers: parseInt(newPlayers?.count || '0', 10),
      activePlayers: parseInt(totalPlayers?.count || '0', 10), // Simplified
    };
  }

  async getPuzzlesOverview(filters: any) {
    const qb = this.eventRepo.createQueryBuilder('event');
    if (filters.from) qb.andWhere('event.createdAt >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('event.createdAt <= :to', { to: filters.to });

    const totalAttempts = await qb.select('COUNT(event.id)', 'count').getRawOne();
    const successRate = await qb.andWhere('event.eventType = :type', { type: 'puzzle_attempt' }).select('AVG(CASE WHEN (event.payload->>\'success\')::boolean = true THEN 1 ELSE 0 END)', 'rate').getRawOne();

    return {
      totalAttempts: parseInt(totalAttempts?.count || '0', 10),
      avgSuccessRate: parseFloat(successRate?.rate || '0') * 100,
    };
  }
}
