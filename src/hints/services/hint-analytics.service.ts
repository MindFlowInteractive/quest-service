import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hint } from '../entities/hint.entity';
import { HintUsage } from '../entities/hint-usage.entity';

export interface HintEffectivenessRow {
  hintId: string;
  order: number;
  type: string;
  usageCount: number;
  successCount: number;
  completionRate: number;
  effectiveness: number;
  averageSatisfaction: number | null;
  averageTimeToCompletion: number | null;
  grade: 'excellent' | 'good' | 'fair' | 'poor' | 'unrated';
}

export interface PuzzleHintAnalytics {
  puzzleId: string;
  totalRequests: number;
  uniqueUsers: number;
  completionsLed: number;
  abuseAttempts: number;
  totalCostCharged: number;
  averageSatisfaction: number | null;
  averageTimeToCompletion: number | null;
  hints: HintEffectivenessRow[];
}

export interface UserHintAnalytics {
  userId: string;
  totalHintsUsed: number;
  puzzlesTouched: number;
  completionsHelped: number;
  totalCostSpent: number;
  averageSatisfaction: number | null;
  lastUsedAt: Date | null;
}

/**
 * Read-only aggregation over the hint + hint-usage tables.
 *
 * Analytics are computed on demand from the usage rows (rather than stored and
 * mutated on every request) so the numbers can never drift out of sync with the
 * underlying events. The per-hint "grade" gives operators a quick signal of
 * which hints actually help players, which is the effectiveness tracking the
 * issue requires.
 */
@Injectable()
export class HintAnalyticsService {
  constructor(
    @InjectRepository(Hint)
    private readonly hintRepo: Repository<Hint>,
    @InjectRepository(HintUsage)
    private readonly usageRepo: Repository<HintUsage>,
  ) {}

  async getPuzzleAnalytics(puzzleId: string): Promise<PuzzleHintAnalytics> {
    const [hints, usages] = await Promise.all([
      this.hintRepo.find({ where: { puzzleId }, order: { order: 'ASC' } }),
      this.usageRepo.find({ where: { puzzleId } }),
    ]);

    const uniqueUsers = new Set(usages.map((u) => u.userId)).size;
    const completionsLed = usages.filter((u) => u.ledToCompletion).length;
    const abuseAttempts = usages.filter((u) => u.isAbuseAttempt).length;
    const totalCostCharged = usages.reduce(
      (sum, u) => sum + Number(u.cost ?? 0),
      0,
    );

    const satisfactionValues = usages
      .map((u) => Number(u.satisfactionRating))
      .filter((v) => Number.isFinite(v) && v > 0);
    const timeValues = usages
      .map((u) => u.timeToCompletion)
      .filter((v): v is number => typeof v === 'number' && v >= 0);

    const rows: HintEffectivenessRow[] = hints.map((hint) => {
      const hintUsages = usages.filter((u) => u.hintId === hint.id);
      const usageCount = hintUsages.length;
      const successCount = hintUsages.filter((u) => u.ledToCompletion).length;
      const completionRate = usageCount === 0 ? 0 : successCount / usageCount;
      const effectiveness = Number(hint.effectiveness ?? 0);

      const hintSatisfaction = hintUsages
        .map((u) => Number(u.satisfactionRating))
        .filter((v) => Number.isFinite(v) && v > 0);
      const hintTimes = hintUsages
        .map((u) => u.timeToCompletion)
        .filter((v): v is number => typeof v === 'number' && v >= 0);

      return {
        hintId: hint.id,
        order: hint.order,
        type: hint.type,
        usageCount,
        successCount,
        completionRate,
        effectiveness,
        averageSatisfaction: average(hintSatisfaction),
        averageTimeToCompletion: average(hintTimes),
        grade: gradeHint(usageCount, completionRate, effectiveness),
      };
    });

    return {
      puzzleId,
      totalRequests: usages.length,
      uniqueUsers,
      completionsLed,
      abuseAttempts,
      totalCostCharged,
      averageSatisfaction: average(satisfactionValues),
      averageTimeToCompletion: average(timeValues),
      hints: rows,
    };
  }

  async getUserAnalytics(userId: string): Promise<UserHintAnalytics> {
    const usages = await this.usageRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    const puzzlesTouched = new Set(usages.map((u) => u.puzzleId)).size;
    const completionsHelped = usages.filter((u) => u.ledToCompletion).length;
    const totalCostSpent = usages.reduce(
      (sum, u) => sum + Number(u.cost ?? 0),
      0,
    );
    const satisfactionValues = usages
      .map((u) => Number(u.satisfactionRating))
      .filter((v) => Number.isFinite(v) && v > 0);

    return {
      userId,
      totalHintsUsed: usages.length,
      puzzlesTouched,
      completionsHelped,
      totalCostSpent,
      averageSatisfaction: average(satisfactionValues),
      lastUsedAt: usages[0]?.createdAt ? new Date(usages[0].createdAt) : null,
    };
  }

  async getGlobalAnalytics() {
    const [totalHints, usages] = await Promise.all([
      this.hintRepo.count(),
      this.usageRepo.find(),
    ]);

    const totalRequests = usages.length;
    const uniqueUsers = new Set(usages.map((u) => u.userId)).size;
    const completionRate =
      totalRequests === 0
        ? 0
        : usages.filter((u) => u.ledToCompletion).length / totalRequests;

    return {
      totalHints,
      totalRequests,
      uniqueUsers,
      completionRate,
      abuseAttempts: usages.filter((u) => u.isAbuseAttempt).length,
      totalCostCharged: usages.reduce(
        (sum, u) => sum + Number(u.cost ?? 0),
        0,
      ),
    };
  }
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function gradeHint(
  usageCount: number,
  completionRate: number,
  effectiveness: number,
): HintEffectivenessRow['grade'] {
  if (usageCount === 0) return 'unrated';
  const score = 0.6 * completionRate + 0.4 * effectiveness;
  if (score >= 0.75) return 'excellent';
  if (score >= 0.5) return 'good';
  if (score >= 0.25) return 'fair';
  return 'poor';
}
