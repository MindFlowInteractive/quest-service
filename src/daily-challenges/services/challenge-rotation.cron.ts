import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DailyChallenge } from '../entities/daily-challenge.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Injectable()
export class ChallengeRotationCron {
  private readonly logger = new Logger(ChallengeRotationCron.name);

  constructor(
    @InjectRepository(DailyChallenge)
    private readonly dailyChallengeRepo: Repository<DailyChallenge>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepo: Repository<Puzzle>,
  ) {}

  /**
   * Helper to get start of current UTC Day
   */
  private getStartOfUTCDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async rotateDailyChallenge() {
    this.logger.log('Starting daily challenge rotation cron...');

    const today = this.getStartOfUTCDay();

    // Deactivate previous active challenges
    await this.dailyChallengeRepo.update(
      { challengeDate: today, isActive: true },
      { isActive: false },
    ); // (Should not exist yet for today, but edge case handling)

    // Check if we already have one created
    const existing = await this.dailyChallengeRepo.findOne({
      where: { challengeDate: today },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await this.dailyChallengeRepo.save(existing);
      }
      return;
    }

    // Determine target difficulty for today. (e.g. rotating: easy -> medium -> hard -> expert)
    const dayOfWeek = new Date().getUTCDay(); // 0 is Sunday, 6 is Saturday
    let targetDifficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium';

    if (dayOfWeek === 1 || dayOfWeek === 2)
      targetDifficulty = 'easy'; // Mon, Tue
    else if (dayOfWeek === 3 || dayOfWeek === 4)
      targetDifficulty = 'medium'; // Wed, Thu
    else if (dayOfWeek === 5)
      targetDifficulty = 'hard'; // Fri
    else targetDifficulty = 'expert'; // Sat, Sun

    // Fetch random puzzle of this difficulty that has not been a daily challenge recently
    const recentChallenges = await this.dailyChallengeRepo.find({
      order: { challengeDate: 'DESC' },
      take: 30, // Don't reuse puzzles from last 30 days
      select: ['puzzleId'],
    });

    const excludedPuzzleIds = recentChallenges.map((rc) => rc.puzzleId);

    const query = this.puzzleRepo
      .createQueryBuilder('puzzle')
      .where('puzzle.isActive = :isActive', { isActive: true })
      .andWhere('puzzle.difficulty = :difficulty', {
        difficulty: targetDifficulty,
      });

    if (excludedPuzzleIds.length > 0) {
      query.andWhere('puzzle.id NOT IN (:...excludedIds)', {
        excludedIds: excludedPuzzleIds,
      });
    }

    // Pick a random one
    query.orderBy('RANDOM()').limit(1);
    const selectedPuzzle = await query.getOne();

    if (!selectedPuzzle) {
      this.logger.error(
        'Failed to find an active puzzle for the daily challenge! Falling back to any puzzle.',
      );
      // Fallback: Just grab any active puzzle
      const fallbackPuzzle = await this.puzzleRepo
        .createQueryBuilder('puzzle')
        .where('puzzle.isActive = :isActive', { isActive: true })
        .orderBy('RANDOM()')
        .limit(1)
        .getOne();

      if (fallbackPuzzle) {
        await this.createChallengeForPuzzle(fallbackPuzzle, today);
      } else {
        this.logger.error(
          'No puzzles found in the database. Cannot create daily challenge.',
        );
      }
      return;
    }

    await this.createChallengeForPuzzle(selectedPuzzle, today);
  }

  private async createChallengeForPuzzle(puzzle: Puzzle, date: Date) {
    const dailyChallenge = this.dailyChallengeRepo.create({
      puzzleId: puzzle.id,
      challengeDate: date,
      isActive: true,
      difficultyModifier: 1.0, // Base modifier
      baseRewardPoints: puzzle.basePoints * 2, // Double points for daily challenges!
    });

    await this.dailyChallengeRepo.save(dailyChallenge);
    this.logger.log(
      `Created new daily challenge for ${date.toISOString()}: Puzzle ID ${puzzle.id}`,
    );
  }
}
