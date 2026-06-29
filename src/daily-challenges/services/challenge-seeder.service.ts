import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyChallenge } from '../entities/daily-challenge.entity';
import { WeeklyChallenge } from '../entities/weekly-challenge.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Injectable()
export class ChallengeSeeder {
  private readonly logger = new Logger(ChallengeSeeder.name);

  constructor(
    @InjectRepository(DailyChallenge)
    private readonly dailyChallengeRepo: Repository<DailyChallenge>,
    @InjectRepository(WeeklyChallenge)
    private readonly weeklyChallengeRepo: Repository<WeeklyChallenge>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepo: Repository<Puzzle>,
  ) {}

  /**
   * Helper to get start of UTC day
   */
  private getStartOfUTCDay(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Helper to get Monday (start) of UTC week
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
   * Seed initial 4 weeks of daily and weekly challenges
   */
  async seedChallenges(): Promise<void> {
    this.logger.log('Starting challenge seed...');

    try {
      const today = this.getStartOfUTCDay();
      const weekStart = this.getStartOfUTCWeek(today);

      // Get enough puzzles to seed challenges
      const puzzles = await this.puzzleRepo.find({
        where: { isActive: true },
        take: 100,
      });

      if (puzzles.length === 0) {
        this.logger.warn('No puzzles found in database. Cannot seed challenges.');
        return;
      }

      // Seed 28 daily challenges (4 weeks)
      await this.seedDailyChallenges(puzzles, today);

      // Seed 4 weekly challenges (4 weeks)
      await this.seedWeeklyChallenges(puzzles, weekStart);

      this.logger.log('Challenge seed completed successfully.');
    } catch (error) {
      this.logger.error('Error seeding challenges:', error);
      throw error;
    }
  }

  /**
   * Seed daily challenges for the next 4 weeks
   */
  private async seedDailyChallenges(
    puzzles: Puzzle[],
    startDate: Date,
  ): Promise<void> {
    const difficulties: Array<'easy' | 'medium' | 'hard' | 'expert'> = [
      'easy',
      'easy',
      'medium',
      'medium',
      'hard',
      'hard',
      'expert',
    ];

    for (let i = 0; i < 28; i++) {
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + i);

      // Check if challenge already exists
      const existing = await this.dailyChallengeRepo.findOne({
        where: { challengeDate: date },
      });

      if (existing) {
        continue;
      }

      // Select difficulty based on day of week
      const dayOfWeek = date.getUTCDay();
      const difficulty = difficulties[dayOfWeek];

      // Find a puzzle with this difficulty
      const candidatePuzzles = puzzles.filter(
        (p) => p.difficulty === difficulty,
      );

      if (candidatePuzzles.length === 0) {
        this.logger.warn(
          `No puzzles found for difficulty ${difficulty}. Skipping day ${date.toISOString()}.`,
        );
        continue;
      }

      // Select random puzzle
      const puzzle =
        candidatePuzzles[
          Math.floor(Math.random() * candidatePuzzles.length)
        ];

      const dailyChallenge = this.dailyChallengeRepo.create({
        puzzleId: puzzle.id,
        challengeDate: date,
        isActive: i === 0, // Only today is active
        difficultyModifier: 1.0,
        baseRewardPoints: puzzle.basePoints * 2,
        bonusXP: Math.floor((puzzle.difficultyRating || 5) * 10),
        completionCount: 0,
      });

      await this.dailyChallengeRepo.save(dailyChallenge);
    }

    this.logger.log('Seeded 28 daily challenges.');
  }

  /**
   * Seed weekly challenges for the next 4 weeks
   */
  private async seedWeeklyChallenges(
    puzzles: Puzzle[],
    startDate: Date,
  ): Promise<void> {
    for (let week = 0; week < 4; week++) {
      const weekStartDate = new Date(startDate);
      weekStartDate.setUTCDate(weekStartDate.getUTCDate() + week * 7);

      // Check if challenge already exists
      const existing = await this.weeklyChallengeRepo.findOne({
        where: { weekStart: weekStartDate },
      });

      if (existing) {
        continue;
      }

      // Select 4 puzzles: 1 easy, 1 medium, 1 hard, 1 random
      const selectedPuzzles: Puzzle[] = [];
      const difficulties = ['easy', 'medium', 'hard'];

      for (const difficulty of difficulties) {
        const candidatePuzzles = puzzles.filter(
          (p) => p.difficulty === difficulty,
        );
        if (candidatePuzzles.length > 0) {
          selectedPuzzles.push(
            candidatePuzzles[
              Math.floor(Math.random() * candidatePuzzles.length)
            ],
          );
        }
      }

      // Add one more random puzzle
      if (puzzles.length > 3) {
        selectedPuzzles.push(
          puzzles[Math.floor(Math.random() * puzzles.length)],
        );
      }

      if (selectedPuzzles.length < 3) {
        this.logger.warn(
          `Not enough puzzles for week ${week}. Skipping.`,
        );
        continue;
      }

      const totalBonusXP = selectedPuzzles.reduce(
        (sum, p) => sum + Math.floor((p.difficultyRating || 5) * 10),
        0,
      );

      const weeklyChallenge = this.weeklyChallengeRepo.create({
        weekStart: weekStartDate,
        puzzles: selectedPuzzles,
        puzzleIds: selectedPuzzles.map((p) => p.id),
        bonusXP: Math.min(totalBonusXP * 1.5, 500),
        completionCount: 0,
        isActive: week === 0, // Only current week is active
      });

      await this.weeklyChallengeRepo.save(weeklyChallenge);
    }

    this.logger.log('Seeded 4 weekly challenges.');
  }
}
