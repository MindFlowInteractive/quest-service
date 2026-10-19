import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { HintUsage } from '../entities/hint-usage.entity';

export interface HintLimitConfig {
  maxHintsPerPuzzle: number;
  maxHintsPerDay: number;
  cooldownSeconds: number;
  dailyCostBudget: number;
}

export interface HintLimitStatus {
  allowed: boolean;
  reason?: string;
  puzzleId: string;
  usedForPuzzle: number;
  puzzleLimit: number;
  remainingForPuzzle: number;
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  costSpentToday: number;
  dailyCostBudget: number;
  remainingCostBudget: number;
  cooldownRemainingMs: number;
  nextAllowedAt?: Date;
}

/**
 * Enforces the fairness controls for the hint system: a per-puzzle cap, a
 * per-day cap, a short cooldown between requests, and a daily cost budget.
 *
 * The limits are read from the environment so operations can tune them without
 * a code change, and are all resolved into a single status object that the API
 * can surface to clients ("3 of 3 hints used", "wait 12s", ...).
 */
@Injectable()
export class HintLimitsService {
  constructor(
    @InjectRepository(HintUsage)
    private readonly usageRepo: Repository<HintUsage>,
  ) {}

  readonly config: HintLimitConfig = {
    maxHintsPerPuzzle: Number(process.env.HINT_MAX_PER_PUZZLE ?? 3),
    maxHintsPerDay: Number(process.env.HINT_MAX_PER_DAY ?? 10),
    cooldownSeconds: Number(process.env.HINT_COOLDOWN_SECONDS ?? 15),
    dailyCostBudget: Number(process.env.HINT_DAILY_COST_BUDGET ?? 50),
  };

  private startOfUtcDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  async getStatus(
    userId: string,
    puzzleId: string,
    additionalCost = 0,
  ): Promise<HintLimitStatus> {
    const dayStart = this.startOfUtcDay();

    const usedForPuzzle = await this.usageRepo.count({
      where: { userId, puzzleId },
    });

    const todayUsages = await this.usageRepo.find({
      where: { userId, createdAt: MoreThanOrEqual(dayStart) },
      order: { createdAt: 'DESC' },
    });

    const usedToday = todayUsages.length;
    const costSpentToday = todayUsages.reduce(
      (sum, usage) => sum + Number(usage.cost ?? 0),
      0,
    );

    const lastUsageAt = todayUsages[0]?.createdAt
      ? new Date(todayUsages[0].createdAt)
      : null;
    const cooldownMs = this.config.cooldownSeconds * 1000;
    const cooldownRemainingMs = lastUsageAt
      ? Math.max(0, cooldownMs - (Date.now() - lastUsageAt.getTime()))
      : 0;

    const remainingForPuzzle = Math.max(
      0,
      this.config.maxHintsPerPuzzle - usedForPuzzle,
    );
    const remainingToday = Math.max(0, this.config.maxHintsPerDay - usedToday);
    const cost = Math.max(0, additionalCost);
    const remainingCostBudget = Math.max(
      0,
      this.config.dailyCostBudget - costSpentToday,
    );

    let reason: string | undefined;
    if (remainingForPuzzle <= 0) {
      reason = 'Hint limit reached for this puzzle';
    } else if (remainingToday <= 0) {
      reason = 'Daily hint limit reached';
    } else if (cooldownRemainingMs > 0) {
      reason = 'Please wait before requesting another hint';
    } else if (cost > remainingCostBudget) {
      reason = 'Not enough hint budget remaining for today';
    }

    const nextAllowedAt =
      cooldownRemainingMs > 0
        ? new Date(Date.now() + cooldownRemainingMs)
        : undefined;

    return {
      allowed: reason === undefined,
      reason,
      puzzleId,
      usedForPuzzle,
      puzzleLimit: this.config.maxHintsPerPuzzle,
      remainingForPuzzle,
      usedToday,
      dailyLimit: this.config.maxHintsPerDay,
      remainingToday,
      costSpentToday,
      dailyCostBudget: this.config.dailyCostBudget,
      remainingCostBudget,
      cooldownRemainingMs,
      nextAllowedAt,
    };
  }

  async assertAllowed(
    userId: string,
    puzzleId: string,
    additionalCost = 0,
  ): Promise<HintLimitStatus> {
    const status = await this.getStatus(userId, puzzleId, additionalCost);
    if (!status.allowed) {
      throw new ForbiddenException(status.reason);
    }
    return status;
  }
}
