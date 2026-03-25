import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, In } from 'typeorm';

import { DailyChallenge } from '../entities/daily-challenge.entity';
import { DailyChallengeCompletion } from '../entities/daily-challenge-completion.entity';
import { WeeklyChallenge } from '../entities/weekly-challenge.entity';
import { WeeklyChallengeCompletion } from '../entities/weekly-challenge-completion.entity';
import { UserStreak } from '../../users/entities/user-streak.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class DailyChallengesService {
  private readonly logger = new Logger(DailyChallengesService.name);

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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Helper to get the start of the current UTC day.
   */
  private getStartOfUTCDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Gets the active challenge for today.
   */
  async getActiveChallenge(userId?: string) {
    const today = this.getStartOfUTCDay();

    const challenge = await this.dailyChallengeRepo.findOne({
      where: { challengeDate: today, isActive: true },
      relations: ['puzzle'],
    });

    if (!challenge) {
      throw new NotFoundException('No active daily challenge found for today.');
    }

    let completed = false;
    if (userId) {
      const completion = await this.completionRepo.findOne({
        where: { userId, dailyChallengeId: challenge.id },
      });
      completed = !!completion;
    }

    return { challenge, completed };
  }

  /**
   * Completes a daily challenge (legacy method - for backward compatibility).
   * Use completeDailyChallenge for new code with XP support.
   */
  async completeChallenge(
    userId: string,
    challengeId: string,
    payload: { score: number; timeSpent: number },
  ) {
    return this.completeDailyChallenge(userId, challengeId, payload);
  }

  /**
   * Retrieves user's challenge history.
   */
  async getHistory(userId: string, limit = 30) {
    const completions = await this.completionRepo.find({
      where: { userId },
      relations: ['dailyChallenge', 'dailyChallenge.puzzle'],
      order: { completedAt: 'DESC' },
      take: limit,
    });

    return completions;
  }

  /**
   * Processes the user's streak logic based on dates and grace periods.
   */
  private async processStreakAndBonus(
    userId: string,
    basePoints: number,
  ): Promise<{ newStreak: number; bonusPoints: number }> {
    let userStreak = await this.userStreakRepo.findOne({
      where: { user: { id: userId } },
    });
    const now = new Date();
    const todayStart = this.getStartOfUTCDay(now);

    if (!userStreak) {
      // First time completing any puzzle or daily challenge
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      userStreak = this.userStreakRepo.create({
        user: user,
        currentStreak: 1,
        streakStartDate: now,
        lastPuzzleCompletedAt: now,
      });
    } else {
      const lastCompletion = userStreak.lastPuzzleCompletedAt
        ? new Date(userStreak.lastPuzzleCompletedAt)
        : null;
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

      if (!lastCompletion) {
        userStreak.currentStreak = 1;
        userStreak.streakStartDate = now;
      } else {
        const lastCompletionUTCDay = this.getStartOfUTCDay(lastCompletion);

        if (lastCompletionUTCDay.getTime() === todayStart.getTime()) {
          // Already completed a puzzle today, streak remains same, but we still update the timestamp.
          // Note: Daily challenges themselves are limited to 1 per day per user, but `UserStreak` might track all puzzles.
        } else if (
          lastCompletionUTCDay.getTime() === yesterdayStart.getTime()
        ) {
          // Streak maintained normally
          userStreak.currentStreak += 1;
        } else {
          // Check grace period
          if (
            userStreak.streakRecoveryGracePeriodEnd &&
            new Date(userStreak.streakRecoveryGracePeriodEnd) > now
          ) {
            // Grace period saved the streak
            userStreak.currentStreak += 1;
          } else {
            // Streak broken
            userStreak.currentStreak = 1;
            userStreak.streakStartDate = now;
          }
        }
      }
      userStreak.lastPuzzleCompletedAt = now;
    }

    await this.userStreakRepo.save(userStreak);

    // Calculate Bonus (e.g. 5% extra per consecutive day past day 1, capped at 50%)
    const streakMultiplier = Math.min(
      (userStreak.currentStreak - 1) * 0.05,
      0.5,
    );
    let bonusPoints = 0;
    if (streakMultiplier > 0) {
      bonusPoints = Math.floor(basePoints * streakMultiplier);
    }

    return { newStreak: userStreak.currentStreak, bonusPoints };
  }

  /**
   * Gets the Monday (start) of the current week in UTC
   */
  private getStartOfUTCWeek(date: Date = new Date()): Date {
    const d = new Date(date);
    const dayOfWeek = d.getUTCDay();
    const daysToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    d.setUTCDate(d.getUTCDate() + daysToMonday);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Gets the active weekly challenge for this week
   */
  async getActiveWeeklyChallenge(userId?: string) {
    const weekStart = this.getStartOfUTCWeek();

    const challenge = await this.weeklyChallengeRepo.findOne({
      where: { weekStart, isActive: true },
      relations: ['puzzles'],
    });

    if (!challenge) {
      throw new NotFoundException('No active weekly challenge found for this week.');
    }

    let userProgress = null;
    if (userId) {
      const completion = await this.weeklyCompletionRepo.findOne({
        where: { userId, weeklyChallengeId: challenge.id },
      });
      userProgress = completion ? {
        completedPuzzleIds: completion.completedPuzzleIds,
        allPuzzlesCompleted: completion.allPuzzlesCompleted,
        bonusXPAwarded: completion.bonusXPAwarded,
      } : null;
    }

    return { challenge, userProgress };
  }

  /**
   * Records a puzzle completion for the weekly challenge
   * Awards bonus XP if all puzzles are completed
   */
  async completeWeeklyPuzzle(
    userId: string,
    weeklyChallengeId: string,
    puzzleId: string,
  ) {
    const weeklyChallenge = await this.weeklyChallengeRepo.findOne({
      where: { id: weeklyChallengeId, isActive: true },
    });

    if (!weeklyChallenge) {
      throw new NotFoundException('Weekly challenge not found or no longer active.');
    }

    if (!weeklyChallenge.puzzleIds.includes(puzzleId)) {
      throw new BadRequestException('Puzzle is not part of this weekly challenge.');
    }

    let completion = await this.weeklyCompletionRepo.findOne({
      where: { userId, weeklyChallengeId },
    });

    if (!completion) {
      completion = this.weeklyCompletionRepo.create({
        userId,
        weeklyChallengeId,
        completedPuzzleIds: [],
      });
    }

    // Check if already completed
    if (completion.completedPuzzleIds.includes(puzzleId)) {
      throw new BadRequestException('Puzzle already completed in this weekly challenge.');
    }

    // Add puzzle to completed list
    completion.completedPuzzleIds = [...completion.completedPuzzleIds, puzzleId];
    completion.completedAt = new Date();

    // Check if all puzzles are completed
    if (completion.completedPuzzleIds.length === weeklyChallenge.puzzleIds.length) {
      completion.allPuzzlesCompleted = true;
      completion.bonusXPAwarded = weeklyChallenge.bonusXP;
      
      // Increment completion count
      await this.weeklyChallengeRepo.increment(
        { id: weeklyChallengeId },
        'completionCount',
        1,
      );
    }

    await this.weeklyCompletionRepo.save(completion);

    return {
      success: true,
      completedPuzzleIds: completion.completedPuzzleIds,
      allPuzzlesCompleted: completion.allPuzzlesCompleted,
      bonusXPAwarded: completion.bonusXPAwarded,
    };
  }

  /**
   * Complete a daily challenge with bonus XP award
   * Replaces the old completeChallenge method with XP support
   */
  async completeDailyChallenge(
    userId: string,
    challengeId: string,
    payload: { score: number; timeSpent: number },
  ) {
    const challenge = await this.dailyChallengeRepo.findOne({
      where: { id: challengeId, isActive: true },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found or no longer active.');
    }

    // Check if already completed
    const existingCompletion = await this.completionRepo.findOne({
      where: { userId, dailyChallengeId: challengeId },
    });

    if (existingCompletion) {
      throw new BadRequestException('Challenge already completed today.');
    }

    // Process streak logic and bonus points
    const { newStreak, bonusPoints } = await this.processStreakAndBonus(
      userId,
      challenge.baseRewardPoints,
    );

    // Record completion with bonus XP
    const completion = this.completionRepo.create({
      userId,
      dailyChallengeId: challengeId,
      score: payload.score,
      timeSpent: payload.timeSpent,
      streakBonusAwarded: bonusPoints,
      bonusXPAwarded: challenge.bonusXP,
      bonusXPClaimed: false,
      completedAt: new Date(),
    });

    await this.completionRepo.save(completion);

    // Increment completion count
    await this.dailyChallengeRepo.increment(
      { id: challengeId },
      'completionCount',
      1,
    );

    return {
      success: true,
      currentStreak: newStreak,
      bonusPointsAwarded: bonusPoints,
      bonusXPAwarded: challenge.bonusXP,
      totalPointsEarned: challenge.baseRewardPoints + bonusPoints,
      totalXPEarned: challenge.bonusXP,
      completion,
    };
  }

  /**
   * Claims bonus XP from a completed daily challenge
   * Ensures bonus XP is only claimed once
   */
  async claimBonusXP(userId: string, completionId: string) {
    const completion = await this.completionRepo.findOne({
      where: { id: completionId, userId },
      relations: ['dailyChallenge'],
    });

    if (!completion) {
      throw new NotFoundException('Completion not found.');
    }

    if (completion.bonusXPClaimed) {
      throw new BadRequestException('Bonus XP already claimed for this completion.');
    }

    completion.bonusXPClaimed = true;
    await this.completionRepo.save(completion);

    return {
      success: true,
      bonusXPAwarded: completion.bonusXPAwarded,
    };
  }

  /**
   * Retrieves user's challenge history including both daily and weekly completions
   */
  async getHistory(userId: string, limit = 30, challengeType?: 'daily' | 'weekly') {
    if (!challengeType || challengeType === 'daily') {
      const completions = await this.completionRepo.find({
        where: { userId },
        relations: ['dailyChallenge', 'dailyChallenge.puzzle'],
        order: { completedAt: 'DESC' },
        take: limit,
      });
      return completions;
    } else {
      const completions = await this.weeklyCompletionRepo.find({
        where: { userId },
        relations: ['weeklyChallenge', 'weeklyChallenge.puzzles'],
        order: { completedAt: 'DESC' },
        take: limit,
      });
      return completions;
    }
  }
}

