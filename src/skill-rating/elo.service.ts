import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerRating, SkillTier } from './entities/player-rating.entity';
import { RatingHistory, RatingChangeReason } from './entities/rating-history.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { Season } from './entities/season.entity';

export interface ELOCalculationResult {
  ratingChange: number;
  newRating: number;
  expectedWinProbability: number;
  kFactor: number;
  performanceScore: number;
  bonusFactors: string[];
}

export interface PuzzleCompletionData {
  userId: string;
  puzzleId: string;
  puzzleDifficulty: string;
  difficultyRating: number; // 1-10 scale
  wasCompleted: boolean;
  timeTaken: number; // in seconds
  hintsUsed: number;
  attempts: number;
  basePoints: number;
}

@Injectable()
export class ELOService {
  private readonly logger = new Logger(ELOService.name);

  constructor(
    @InjectRepository(PlayerRating)
    private playerRatingRepository: Repository<PlayerRating>,
    @InjectRepository(RatingHistory)
    private ratingHistoryRepository: Repository<RatingHistory>,
    @InjectRepository(Season)
    private seasonRepository: Repository<Season>,
  ) {}

  /**
   * Calculate ELO rating change based on puzzle completion
   */
  async calculateRatingChange(
    playerRating: PlayerRating,
    puzzle: Puzzle,
    completionData: PuzzleCompletionData,
  ): Promise<ELOCalculationResult> {
    // Get current active season
    const currentSeason = await this.getCurrentSeason();
    
    // Get puzzle difficulty rating (1-10 scale)
    const puzzleDifficultyRating = puzzle.difficultyRating || 5;
    
    // Calculate expected win probability using ELO formula
    const expectedWinProbability = this.calculateExpectedWinProbability(
      playerRating.rating,
      puzzleDifficultyRating,
    );
    
    // Calculate performance score (0-1)
    const performanceScore = this.calculatePerformanceScore(completionData);
    
    // Determine actual outcome (1 = win, 0 = loss, 0.5 = draw)
    const actualOutcome = completionData.wasCompleted ? 1 : 0;
    
    // Calculate K-factor based on player experience and rating
    const kFactor = this.calculateKFactor(playerRating);
    
    // Calculate base rating change
    let ratingChange = kFactor * (actualOutcome - expectedWinProbability);
    
    // Apply performance multipliers
    const bonusFactors: string[] = [];
    
    // Time-based bonus/penalty
    if (completionData.wasCompleted) {
      const timeBonus = this.calculateTimeBonus(
        completionData.timeTaken,
        puzzle.timeLimit,
        puzzleDifficultyRating,
      );
      if (timeBonus !== 0) {
        ratingChange += timeBonus;
        bonusFactors.push(`time_${timeBonus > 0 ? 'bonus' : 'penalty'}`);
      }
    }
    
    // Hint penalty
    if (completionData.hintsUsed > 0) {
      const hintPenalty = completionData.hintsUsed * -5;
      ratingChange += hintPenalty;
      bonusFactors.push(`hint_penalty_${completionData.hintsUsed}`);
    }
    
    // Attempt penalty
    if (completionData.attempts > 1) {
      const attemptPenalty = (completionData.attempts - 1) * -3;
      ratingChange += attemptPenalty;
      bonusFactors.push(`attempt_penalty_${completionData.attempts}`);
    }
    
    // Difficulty weighting
    const difficultyMultiplier = this.getDifficultyMultiplier(puzzleDifficultyRating);
    ratingChange = ratingChange * difficultyMultiplier;
    bonusFactors.push(`difficulty_${puzzle.difficulty}`);
    
    // Ensure rating doesn't go below minimum
    const newRating = Math.max(100, Math.round(playerRating.rating + ratingChange));
    ratingChange = newRating - playerRating.rating;
    
    return {
      ratingChange,
      newRating,
      expectedWinProbability,
      kFactor,
      performanceScore,
      bonusFactors,
    };
  }

  /**
   * Calculate expected win probability using ELO formula
   */
  private calculateExpectedWinProbability(
    playerRating: number,
    puzzleDifficulty: number, // 1-10 scale
  ): number {
    // Convert puzzle difficulty (1-10) to ELO-like rating
    // Difficulty 1 = 800, Difficulty 10 = 2000
    const puzzleEloRating = 800 + (puzzleDifficulty - 1) * 133.33;
    
    // Standard ELO formula
    return 1 / (1 + Math.pow(10, (puzzleEloRating - playerRating) / 400));
  }

  /**
   * Calculate performance score based on completion metrics
   */
  private calculatePerformanceScore(data: PuzzleCompletionData): number {
    if (!data.wasCompleted) return 0;
    
    let score = 0.5; // Base score for completion
    
    // Time performance (0-0.3)
    const timeRatio = data.timeTaken / data.basePoints; // Assuming basePoints relates to expected time
    if (timeRatio <= 0.5) score += 0.3; // Very fast
    else if (timeRatio <= 0.8) score += 0.2; // Fast
    else if (timeRatio <= 1.2) score += 0.1; // Average
    
    // Hint efficiency (0-0.1)
    if (data.hintsUsed === 0) score += 0.1;
    else if (data.hintsUsed === 1) score += 0.05;
    
    // Attempt efficiency (0-0.1)
    if (data.attempts === 1) score += 0.1;
    else if (data.attempts === 2) score += 0.05;
    
    return Math.min(1, score);
  }

  /**
   * Calculate K-factor based on player experience
   */
  private calculateKFactor(playerRating: PlayerRating): number {
    // New players get higher K-factor for faster rating adjustment
    if (playerRating.gamesPlayed < 30) return 40;
    
    // Established players
    if (playerRating.rating < 2000) return 20;
    
    // High-rated players
    if (playerRating.rating < 2400) return 15;
    
    // Masters get lower K-factor
    return 10;
  }

  /**
   * Calculate time-based bonus or penalty
   */
  private calculateTimeBonus(
    timeTaken: number,
    timeLimit: number,
    difficulty: number,
  ): number {
    const ratio = timeTaken / timeLimit;
    
    if (ratio <= 0.3) return 15; // Very fast
    if (ratio <= 0.6) return 10; // Fast
    if (ratio <= 1.0) return 5;  // On time
    if (ratio <= 1.5) return -5; // Slow
    return -10; // Very slow
  }

  /**
   * Get difficulty multiplier
   */
  private getDifficultyMultiplier(difficulty: number): number {
    // Higher difficulty = higher potential rating change
    if (difficulty >= 8) return 1.5; // Expert
    if (difficulty >= 6) return 1.3; // Hard
    if (difficulty >= 4) return 1.1; // Medium
    return 1.0; // Easy
  }

  /**
   * Get skill tier based on rating
   */
  getSkillTier(rating: number): SkillTier {
    if (rating >= 2400) return SkillTier.GRANDMASTER;
    if (rating >= 2000) return SkillTier.MASTER;
    if (rating >= 1800) return SkillTier.DIAMOND;
    if (rating >= 1600) return SkillTier.PLATINUM;
    if (rating >= 1400) return SkillTier.GOLD;
    if (rating >= 1200) return SkillTier.SILVER;
    return SkillTier.BRONZE;
  }

  /**
   * Get current active season
   */
  async getCurrentSeason(): Promise<Season> {
    const season = await this.seasonRepository.findOne({
      where: { status: 'active' },
      order: { startDate: 'DESC' },
    });
    
    if (!season) {
      throw new Error('No active season found');
    }
    
    return season;
  }

  /**
   * Calculate rating decay for inactive players
   */
  calculateInactivityDecay(rating: number, daysInactive: number): number {
    if (daysInactive < 30) return 0;
    
    // Decay starts after 30 days
    const decayDays = daysInactive - 30;
    const decayPoints = Math.floor(decayDays / 7) * 2; // 2 points per week
    
    return Math.max(0, rating - decayPoints) - rating;
  }
}
