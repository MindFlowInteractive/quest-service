import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { DailyChallenge } from '../entities/daily-challenge.entity';
import { WeeklyChallenge } from '../entities/weekly-challenge.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Injectable()
export class ChallengeRotationCron {
  private readonly logger = new Logger(ChallengeRotationCron.name);

  constructor(
    @InjectRepository(DailyChallenge)
    private readonly dailyChallengeRepo: Repository<DailyChallenge>,
    @InjectRepository(WeeklyChallenge)
    private readonly weeklyChallengeRepo: Repository<WeeklyChallenge>,
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

  /**
   * Helper to get Monday (start) of current UTC week
   */
  private getStartOfUTCWeek(date: Date = new Date()): Date {
    const d = new Date(date);
    const dayOfWeek = d.getUTCDay();
    const daysToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    d.setUTCDate(d.getUTCDate() + daysToMonday);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async rotateDailyChallenge() {
    this.logger.log('Starting daily challenge rotation cron...');

    const today = this.getStartOfUTCDay();

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

    // Fetch random puzzle using weighted selection
    const selectedPuzzle = await this.selectPuzzleWithWeighting(
      targetDifficulty,
      30, // Don't reuse puzzles from last 30 days
    );

    if (!selectedPuzzle) {
      this.logger.error(
        'No suitable puzzle found for daily challenge generation.',
      );
      return;
    }

    await this.createDailyChallenge(selectedPuzzle, today);
  }

  /**
   * Cron job to generate weekly challenges every Monday
   */
  @Cron('0 0 * * 1', { timeZone: 'UTC' }) // Monday at midnight UTC
  async rotateWeeklyChallenge() {
    this.logger.log('Starting weekly challenge rotation cron...');

    const weekStart = this.getStartOfUTCWeek();

    // Check if we already have one for this week
    const existing = await this.weeklyChallengeRepo.findOne({
      where: { weekStart },
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await this.weeklyChallengeRepo.save(existing);
      }
      return;
    }

    // Select 3-5 puzzles with weighted distribution across difficulties
    const puzzleCount = Math.floor(Math.random() * 3) + 3; // 3-5 puzzles
    const selectedPuzzles = await this.selectWeeklyPuzzles(puzzleCount);

    if (selectedPuzzles.length < 3) {
      this.logger.error(
        'Failed to select enough puzzles for weekly challenge.',
      );
      return;
    }

    await this.createWeeklyChallenge(selectedPuzzles, weekStart);
  }

  /**
   * Select a puzzle with weighted selection based on difficulty and completion rate
   */
  private async selectPuzzleWithWeighting(
    targetDifficulty: string,
    excludeDaysBack: number,
  ): Promise<Puzzle | null> {
    // Get recently used puzzle IDs
    const recentChallenges = await this.dailyChallengeRepo.find({
      order: { challengeDate: 'DESC' },
      take: excludeDaysBack,
      select: ['puzzleId'],
    });

    const excludedPuzzleIds = recentChallenges.map((rc) => rc.puzzleId);

    // Get candidate puzzles
    let query = this.puzzleRepo
      .createQueryBuilder('puzzle')
      .where('puzzle.isActive = :isActive', { isActive: true })
      .andWhere('puzzle.difficulty = :difficulty', {
        difficulty: targetDifficulty,
      });

    if (excludedPuzzleIds.length > 0) {
      query = query.andWhere('puzzle.id NOT IN (:...excludedIds)', {
        excludedIds: excludedPuzzleIds,
      });
    }

    // Weight puzzles: lower completion rate gets higher weight
    const puzzles = await query.getMany();

    if (puzzles.length === 0) {
      // Fallback: get any active puzzle
      return this.puzzleRepo
        .createQueryBuilder('puzzle')
        .where('puzzle.isActive = :isActive', { isActive: true })
        .orderBy('RANDOM()')
        .limit(1)
        .getOne();
    }

    // Weighted random selection based on 1 / (1 + completionRate)
    // Puzzles with fewer completions are more likely to be selected
    const weights = puzzles.map((p) => {
      const weight = 1 / (1 + (p.completions || 0) / 100);
      return weight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < puzzles.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return puzzles[i];
      }
    }

    return puzzles[puzzles.length - 1];
  }

  /**
   * Select multiple puzzles at different difficulty levels for weekly challenges
   */
  private async selectWeeklyPuzzles(count: number): Promise<Puzzle[]> {
    const difficulties: Array<'easy' | 'medium' | 'hard' | 'expert'> = [
      'easy',
      'medium',
      'hard',
    ];
    const selectedPuzzles: Puzzle[] = [];

    // Distribute difficulty across selections
    for (let i = 0; i < count; i++) {
      const difficulty = difficulties[i % difficulties.length];
      const puzzle = await this.selectPuzzleWithWeighting(difficulty, 14);

      if (puzzle && !selectedPuzzles.find((p) => p.id === puzzle.id)) {
        selectedPuzzles.push(puzzle);
      }
    }

    return selectedPuzzles;
  }

  /**
   * Create a daily challenge
   */
  private async createDailyChallenge(puzzle: Puzzle, date: Date) {
    const dailyChallenge = this.dailyChallengeRepo.create({
      puzzleId: puzzle.id,
      challengeDate: date,
      isActive: true,
      difficultyModifier: 1.0,
      baseRewardPoints: puzzle.basePoints * 2, // Double points for daily challenges
      bonusXP: Math.floor((puzzle.difficultyRating || 5) * 10), // 50-100 XP based on difficulty
      completionCount: 0,
    });

    await this.dailyChallengeRepo.save(dailyChallenge);
    this.logger.log(
      `Created new daily challenge for ${date.toISOString()}: Puzzle ID ${puzzle.id}`,
    );
  }

  /**
   * Create a weekly challenge
   */
  private async createWeeklyChallenge(
    puzzles: Puzzle[],
    weekStart: Date,
  ) {
    const totalBonusXP = puzzles.reduce(
      (sum, p) => sum + Math.floor((p.difficultyRating || 5) * 10),
      0,
    );

    const weeklyChallenge = this.weeklyChallengeRepo.create({
      weekStart,
      puzzles,
      puzzleIds: puzzles.map((p) => p.id),
      bonusXP: Math.min(totalBonusXP * 1.5, 500), // Cap at 500 XP
      completionCount: 0,
      isActive: true,
    });

    await this.weeklyChallengeRepo.save(weeklyChallenge);
    this.logger.log(
      `Created new weekly challenge for week starting ${weekStart.toISOString()}: ${puzzles.length} puzzles`,
    );
  }
}
