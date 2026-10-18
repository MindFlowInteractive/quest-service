import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { DailyChallenge } from '../entities/daily-challenge.entity';
import { DailyChallengeCompletion } from '../entities/daily-challenge-completion.entity';
import { WeeklyChallenge } from '../entities/weekly-challenge.entity';
import { WeeklyChallengeCompletion } from '../entities/weekly-challenge-completion.entity';
import { UserStreak } from '../../users/entities/user-streak.entity';

export interface ChallengeAnalytics {
  challengeId: string;
  challengeDate: string | null;
  puzzleId: string;
  uniquePlayers: number;
  completionCount: number;
  claimedBonusXP: number;
  claimRate: number;
  averageScore: number | null;
  averageTimeSpent: number | null;
  averageStreakBonus: number | null;
  totalStreakBonus: number;
  totalBonusXP: number;
  scoreBuckets: Record<string, number>;
}

export interface ParticipationPoint {
  date: string;
  completions: number;
  averageScore: number | null;
  averageTimeSpent: number | null;
}

export interface ParticipationOverview {
  days: number;
  totalCompletions: number;
  uniquePlayers: number;
  averageCompletionsPerDay: number;
  bestDay: ParticipationPoint | null;
  series: ParticipationPoint[];
}

export interface StreakDistribution {
  totalTracked: number;
  buckets: Array<{ label: string; min: number; max: number | null; count: number }>;
}

@Injectable()
export class ChallengeAnalyticsService {
  constructor(
    @InjectRepository(DailyChallenge)
    private readonly dailyChallengeRepo: Repository<DailyChallenge>,
    @InjectRepository(DailyChallengeCompletion)
    private readonly completionRepo: Repository<DailyChallengeCompletion>,
    @InjectRepository(WeeklyChallenge)
    private readonly weeklyChallengeRepo: Repository<WeeklyChallenge>,
    @InjectRepository(WeeklyChallengeCompletion)
    private readonly weeklyCompletionRepo: Repository<WeeklyChallengeCompletion>,
    @InjectRepository(UserStreak)
    private readonly userStreakRepo: Repository<UserStreak>,
  ) {}

  /**
   * Per-challenge participation and performance analytics.
   */
  async getChallengeAnalytics(challengeId: string): Promise<ChallengeAnalytics> {
    const challenge = await this.dailyChallengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found.');
    }

    const completions = await this.completionRepo.find({
      where: { dailyChallengeId: challengeId },
      order: { completedAt: 'DESC' },
    });

    const scores = completions
      .map((c) => Number(c.score))
      .filter((v) => Number.isFinite(v));
    const times = completions
      .map((c) => Number(c.timeSpent))
      .filter((v) => Number.isFinite(v));
    const streakBonuses = completions
      .map((c) => Number(c.streakBonusAwarded ?? 0))
      .filter((v) => Number.isFinite(v));

    const claimed = completions.filter((c) => c.bonusXPClaimed).length;
    const totalBonusXP = completions.reduce(
      (sum, c) => sum + Number(c.bonusXPAwarded ?? 0),
      0,
    );

    return {
      challengeId,
      challengeDate: challenge.challengeDate
        ? toDateKey(challenge.challengeDate as unknown as Date | string)
        : null,
      puzzleId: challenge.puzzleId,
      uniquePlayers: new Set(completions.map((c) => c.userId)).size,
      completionCount: challenge.completionCount ?? completions.length,
      claimedBonusXP: claimed,
      claimRate:
        completions.length === 0 ? 0 : claimed / completions.length,
      averageScore: average(scores),
      averageTimeSpent: average(times),
      averageStreakBonus: average(streakBonuses),
      totalStreakBonus: streakBonuses.reduce((sum, v) => sum + v, 0),
      totalBonusXP,
      scoreBuckets: bucketScores(scores),
    };
  }

  /**
   * Participation trend over the last `days` days, suitable for a dashboard
   * chart. Includes both days that had a challenge and days without one.
   */
  async getParticipationOverview(days = 7): Promise<ParticipationOverview> {
    const safeDays = Math.min(Math.max(Math.floor(days || 7), 1), 90);
    const since = this.getStartOfUTCDay();
    since.setUTCDate(since.getUTCDate() - (safeDays - 1));

    const [challenges, completions] = await Promise.all([
      this.dailyChallengeRepo.find({
        where: { challengeDate: MoreThanOrEqual(since) },
        order: { challengeDate: 'ASC' },
      }),
      this.completionRepo.find({
        where: { completedAt: MoreThanOrEqual(since) },
      }),
    ]);

    const byDate = new Map<
      string,
      { completions: number; scoreSum: number; scoreCount: number; timeSum: number; timeCount: number }
    >();

    for (let offset = 0; offset < safeDays; offset++) {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + offset);
      byDate.set(toDateKey(d), {
        completions: 0,
        scoreSum: 0,
        scoreCount: 0,
        timeSum: 0,
        timeCount: 0,
      });
    }

    for (const challenge of challenges) {
      const key = toDateKey(challenge.challengeDate as unknown as Date | string);
      const entry = byDate.get(key);
      if (!entry) continue;
      entry.completions = Math.max(
        entry.completions,
        challenge.completionCount ?? 0,
      );
    }

    for (const completion of completions) {
      const key = toDateKey(completion.completedAt);
      const entry = byDate.get(key);
      if (!entry) continue;
      // Completions may exceed the denormalized counter if it has not been
      // incremented yet, so always trust the raw event rows.
      entry.completions += 1;
      const score = Number(completion.score);
      if (Number.isFinite(score)) {
        entry.scoreSum += score;
        entry.scoreCount += 1;
      }
      const timeSpent = Number(completion.timeSpent);
      if (Number.isFinite(timeSpent)) {
        entry.timeSum += timeSpent;
        entry.timeCount += 1;
      }
    }

    const series: ParticipationPoint[] = Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, entry]) => ({
        date,
        completions: entry.completions,
        averageScore:
          entry.scoreCount === 0 ? null : entry.scoreSum / entry.scoreCount,
        averageTimeSpent:
          entry.timeCount === 0 ? null : entry.timeSum / entry.timeCount,
      }));

    const totalCompletions = series.reduce((sum, p) => sum + p.completions, 0);
    const bestDay = series.reduce<ParticipationPoint | null>(
      (best, point) =>
        best === null || point.completions > best.completions ? point : best,
      null,
    );

    return {
      days: safeDays,
      totalCompletions,
      uniquePlayers: new Set(completions.map((c) => c.userId)).size,
      averageCompletionsPerDay:
        series.length === 0 ? 0 : totalCompletions / series.length,
      bestDay: bestDay && bestDay.completions > 0 ? bestDay : null,
      series,
    };
  }

  /**
   * Distribution of current streaks across all players. Useful for tuning the
   * milestone bonuses and grace-period rules.
   */
  async getStreakDistribution(): Promise<StreakDistribution> {
    const streaks = await this.userStreakRepo.find();

    const buckets = [
      { label: '0', min: 0, max: 0, count: 0 },
      { label: '1-2', min: 1, max: 2, count: 0 },
      { label: '3-6', min: 3, max: 6, count: 0 },
      { label: '7-13', min: 7, max: 13, count: 0 },
      { label: '14-29', min: 14, max: 29, count: 0 },
      { label: '30-99', min: 30, max: 99, count: 0 },
      { label: '100+', min: 100, max: null as number | null, count: 0 },
    ];

    for (const streak of streaks) {
      const value = streak.currentStreak ?? 0;
      const bucket =
        buckets.find(
          (b) =>
            value >= b.min && (b.max === null || value <= (b.max as number)),
        ) ?? buckets[0];
      bucket.count += 1;
    }

    return { totalTracked: streaks.length, buckets };
  }

  /**
   * Weekly challenge participation, counted from completion rows.
   */
  async getWeeklyOverview() {
    const [challenges, completions] = await Promise.all([
      this.weeklyChallengeRepo.find({ order: { weekStart: 'DESC' }, take: 8 }),
      this.weeklyCompletionRepo.find(),
    ]);

    return {
      challenges: challenges.map((challenge) => {
        const rows = completions.filter(
          (c) => c.weeklyChallengeId === challenge.id,
        );
        return {
          weeklyChallengeId: challenge.id,
          weekStart: challenge.weekStart,
          completionCount: challenge.completionCount ?? rows.length,
          uniquePlayers: new Set(rows.map((c) => c.userId)).size,
          fullyCompleted: rows.filter((c) => c.allPuzzlesCompleted).length,
          bonusXPAwarded: rows.reduce(
            (sum, c) => sum + Number(c.bonusXPAwarded ?? 0),
            0,
          ),
        };
      }),
    };
  }

  private getStartOfUTCDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}

function toDateKey(value: Date | string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function bucketScores(scores: number[]): Record<string, number> {
  const buckets: Record<string, number> = {
    '0-49': 0,
    '50-74': 0,
    '75-89': 0,
    '90-99': 0,
    '100+': 0,
  };

  for (const score of scores) {
    if (score >= 100) buckets['100+'] += 1;
    else if (score >= 90) buckets['90-99'] += 1;
    else if (score >= 75) buckets['75-89'] += 1;
    else if (score >= 50) buckets['50-74'] += 1;
    else buckets['0-49'] += 1;
  }

  return buckets;
}
