import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';

import { DailyChallenge } from '../entities/daily-challenge.entity';
import { DailyChallengeCompletion } from '../entities/daily-challenge-completion.entity';
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
   * Completes a daily challenge.
   */
  async completeChallenge(
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

    // Record completion
    const completion = this.completionRepo.create({
      userId,
      dailyChallengeId: challengeId,
      score: payload.score,
      timeSpent: payload.timeSpent,
      streakBonusAwarded: bonusPoints,
      completedAt: new Date(),
    });

    await this.completionRepo.save(completion);

    return {
      success: true,
      currentStreak: newStreak,
      bonusPointsAwarded: bonusPoints,
      totalPointsEarned: challenge.baseRewardPoints + bonusPoints,
      completion,
    };
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
}
