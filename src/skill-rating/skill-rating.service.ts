import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PlayerRating, SkillTier, SeasonStatus } from './entities/player-rating.entity';
import { RatingHistory, RatingChangeReason } from './entities/rating-history.entity';
import { Season, SeasonStatus as SeasonEntityStatus } from './entities/season.entity';
import { ELOService, PuzzleCompletionData } from './elo.service';
import { User } from '../users/entities/user.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';

export interface PlayerRatingDetails {
  playerRating: PlayerRating;
  rank: number;
  percentile: number;
}

export interface AbandonRatingInput {
  userId: string;
  puzzleId: string;
  timeTaken: number; // seconds elapsed at time of abandon
  hintsUsed: number;
  attempts: number;
}

/** Fraction of timeLimit that must have elapsed before an abandon affects rating */
const ABANDON_TIME_THRESHOLD = 0.8;

@Injectable()
export class SkillRatingService {
  private readonly logger = new Logger(SkillRatingService.name);

  constructor(
    @InjectRepository(PlayerRating)
    private playerRatingRepository: Repository<PlayerRating>,
    @InjectRepository(RatingHistory)
    private ratingHistoryRepository: Repository<RatingHistory>,
    @InjectRepository(Season)
    private seasonRepository: Repository<Season>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
    private eloService: ELOService,
  ) {}

  /**
   * Get or create player rating for current season
   */
  async getPlayerRating(userId: string): Promise<PlayerRating> {
    const currentSeason = await this.eloService.getCurrentSeason();
    
    let playerRating = await this.playerRatingRepository.findOne({
      where: {
        userId,
        seasonId: currentSeason.seasonId,
      },
    });
    
    if (!playerRating) {
      // Create new rating for player
      playerRating = this.playerRatingRepository.create({
        userId,
        seasonId: currentSeason.seasonId,
        rating: currentSeason.defaultRating,
        tier: this.eloService.getSkillTier(currentSeason.defaultRating),
      });
      playerRating = await this.playerRatingRepository.save(playerRating);
    }
    
    return playerRating;
  }

  /**
   * Update player rating based on puzzle completion
   */
  async updateRatingOnPuzzleCompletion(
    completionData: PuzzleCompletionData,
  ): Promise<PlayerRating> {
    // Get player rating
    let playerRating = await this.getPlayerRating(completionData.userId);
    
    // Get puzzle
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: completionData.puzzleId },
    });
    
    if (!puzzle) {
      throw new Error(`Puzzle not found: ${completionData.puzzleId}`);
    }
    
    // Calculate rating change
    const calculationResult = await this.eloService.calculateRatingChange(
      playerRating,
      puzzle,
      completionData,
    );
    
    // Update player rating
    const oldRating = playerRating.rating;
    playerRating.rating = calculationResult.newRating;
    playerRating.tier = this.eloService.getSkillTier(calculationResult.newRating);
    playerRating.gamesPlayed += 1;
    playerRating.lastPlayedAt = new Date();
    playerRating.lastRatingUpdate = new Date();
    
    if (completionData.wasCompleted) {
      playerRating.wins += 1;
      playerRating.streak += 1;
      if (playerRating.streak > playerRating.bestStreak) {
        playerRating.bestStreak = playerRating.streak;
      }
      
      // Update statistics
      if (!playerRating.statistics.puzzlesSolved) {
        playerRating.statistics.puzzlesSolved = 0;
      }
      playerRating.statistics.puzzlesSolved += 1;
      
      // Update rating history in statistics
      if (!playerRating.statistics.ratingHistory) {
        playerRating.statistics.ratingHistory = [];
      }
      playerRating.statistics.ratingHistory.push({
        date: new Date(),
        rating: calculationResult.newRating,
        change: calculationResult.ratingChange,
        puzzleId: completionData.puzzleId,
        difficulty: completionData.puzzleDifficulty,
      });
      
      // Track highest/lowest ratings
      if (!playerRating.statistics.highestRating || calculationResult.newRating > playerRating.statistics.highestRating) {
        playerRating.statistics.highestRating = calculationResult.newRating;
      }
      if (!playerRating.statistics.lowestRating || calculationResult.newRating < playerRating.statistics.lowestRating) {
        playerRating.statistics.lowestRating = calculationResult.newRating;
      }
    } else {
      playerRating.losses += 1;
      playerRating.streak = 0;
    }
    
    // Update win rate
    playerRating.winRate = Number(
      (playerRating.wins / playerRating.gamesPlayed).toFixed(2),
    );
    
    // Save updated rating
    playerRating = await this.playerRatingRepository.save(playerRating);
    
    // Create rating history record
    const ratingHistory = this.ratingHistoryRepository.create({
      playerRatingId: playerRating.id,
      oldRating,
      newRating: calculationResult.newRating,
      ratingChange: calculationResult.ratingChange,
      reason: completionData.wasCompleted
        ? RatingChangeReason.PUZZLE_COMPLETED
        : RatingChangeReason.PUZZLE_FAILED,
      puzzleId: completionData.puzzleId,
      puzzleDifficulty: completionData.puzzleDifficulty,
      timeTaken: completionData.timeTaken,
      hintsUsed: completionData.hintsUsed,
      attempts: completionData.attempts,
      wasCompleted: completionData.wasCompleted,
      metadata: {
        expectedWinProbability: calculationResult.expectedWinProbability,
        kFactor: calculationResult.kFactor,
        performanceScore: calculationResult.performanceScore,
        bonusFactors: calculationResult.bonusFactors,
      },
    });
    
    await this.ratingHistoryRepository.save(ratingHistory);
    
    this.logger.log(
      `Updated rating for user ${completionData.userId}: ${oldRating} -> ${calculationResult.newRating} (${calculationResult.ratingChange >= 0 ? '+' : ''}${calculationResult.ratingChange})`,
    );
    
    return playerRating;
  }

  /**
   * Get player rating history
   */
  async getRatingHistory(
    userId: string,
    limit: number = 50,
  ): Promise<RatingHistory[]> {
    const playerRating = await this.getPlayerRating(userId);
    
    return this.ratingHistoryRepository.find({
      where: { playerRatingId: playerRating.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get leaderboard for current season
   */
  async getLeaderboard(
    limit: number = 100,
    offset: number = 0,
  ): Promise<PlayerRating[]> {
    const currentSeason = await this.eloService.getCurrentSeason();
    
    return this.playerRatingRepository.find({
      where: {
        seasonId: currentSeason.seasonId,
        seasonStatus: SeasonStatus.ACTIVE,
      },
      order: { rating: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['user'],
    });
  }

  /**
   * Get player rank in current season
   */
  async getPlayerRank(userId: string): Promise<number> {
    const playerRating = await this.getPlayerRating(userId);
    const currentSeason = await this.eloService.getCurrentSeason();
    
    const higherRatedCount = await this.playerRatingRepository.count({
      where: {
        seasonId: currentSeason.seasonId,
        seasonStatus: SeasonStatus.ACTIVE,
        rating: MoreThan(playerRating.rating),
      },
    });
    
    return higherRatedCount + 1;
  }

  /**
   * Apply inactivity decay to players
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async applyInactivityDecay(): Promise<void> {
    this.logger.log('Applying inactivity decay...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Find players who haven't played in 30+ days
    const inactivePlayers = await this.playerRatingRepository
      .createQueryBuilder('rating')
      .where('rating.lastPlayedAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('rating.seasonStatus = :active', { active: SeasonStatus.ACTIVE })
      .getMany();
    
    let decayCount = 0;
    
    for (const playerRating of inactivePlayers) {
      const daysInactive = Math.floor(
        (Date.now() - playerRating.lastPlayedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      
      const decay = this.eloService.calculateInactivityDecay(
        playerRating.rating,
        daysInactive,
      );
      
      if (decay < 0) {
        const oldRating = playerRating.rating;
        playerRating.rating += decay;
        playerRating.tier = this.eloService.getSkillTier(playerRating.rating);
        playerRating.lastRatingUpdate = new Date();
        
        await this.playerRatingRepository.save(playerRating);
        
        // Create rating history record
        const ratingHistory = this.ratingHistoryRepository.create({
          playerRatingId: playerRating.id,
          oldRating,
          newRating: playerRating.rating,
          ratingChange: decay,
          reason: RatingChangeReason.INACTIVITY_DECAY,
          metadata: {
            daysInactive,
          },
        });
        
        await this.ratingHistoryRepository.save(ratingHistory);
        
        decayCount++;
        this.logger.log(
          `Applied decay to user ${playerRating.userId}: ${oldRating} -> ${playerRating.rating} (${decay})`,
        );
      }
    }
    
    this.logger.log(`Applied inactivity decay to ${decayCount} players`);
  }

  /**
   * End current season and reset ratings
   */
  async endSeason(seasonId: string): Promise<void> {
    const season = await this.seasonRepository.findOne({
      where: { seasonId },
    });
    
    if (!season) {
      throw new Error(`Season not found: ${seasonId}`);
    }
    
    // Update season status
    season.status = SeasonEntityStatus.ENDED;
    await this.seasonRepository.save(season);
    
    // If reset is required, create new ratings for next season
    if (season.requiresReset) {
      const currentRatings = await this.playerRatingRepository.find({
        where: {
          seasonId,
          seasonStatus: SeasonStatus.ACTIVE,
        },
      });
      
      const nextSeasonId = this.generateNextSeasonId(seasonId);
      
      for (const rating of currentRatings) {
        // Mark current rating as reset
        rating.seasonStatus = SeasonStatus.RESET;
        await this.playerRatingRepository.save(rating);
        
        // Create new rating for next season
        const newRating = this.playerRatingRepository.create({
          userId: rating.userId,
          rating: season.defaultRating,
          tier: this.eloService.getSkillTier(season.defaultRating),
          seasonId: nextSeasonId,
          seasonStatus: SeasonStatus.ACTIVE,
          statistics: {
            highestRating: season.defaultRating,
            lowestRating: season.defaultRating,
            ratingHistory: [],
          },
        });
        
        await this.playerRatingRepository.save(newRating);
      }
      
      // Create new season
      const newSeason = this.seasonRepository.create({
        name: `Season ${this.extractSeasonNumber(seasonId) + 1}`,
        seasonId: nextSeasonId,
        status: SeasonEntityStatus.ACTIVE,
        startDate: new Date(),
        endDate: this.calculateSeasonEndDate(),
        defaultRating: season.defaultRating,
        requiresReset: season.requiresReset,
        config: season.config,
      });
      
      await this.seasonRepository.save(newSeason);
    }
    
    this.logger.log(`Ended season ${seasonId}`);
  }

  /**
   * Get current season information
   */
  async getCurrentSeason(): Promise<Season> {
    return this.eloService.getCurrentSeason();
  }

  /**
   * Get all seasons
   */
  async getAllSeasons(): Promise<Season[]> {
    return this.seasonRepository.find({
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Generate next season ID
   */
  private generateNextSeasonId(currentSeasonId: string): string {
    const seasonNumber = this.extractSeasonNumber(currentSeasonId);
    return `S${String(seasonNumber + 1).padStart(3, '0')}`;
  }

  /**
   * Extract season number from season ID
   */
  private extractSeasonNumber(seasonId: string): number {
    return parseInt(seasonId.replace('S', ''), 10);
  }

  /**
   * Calculate season end date (3 months from now)
   */
  private calculateSeasonEndDate(): Date {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    return endDate;
  }

  /**
   * Compute the percentile rank for a player within the current season.
   * Percentile = (players with a strictly lower rating / total active players) × 100.
   */
  async getPercentile(userId: string): Promise<number> {
    const playerRating = await this.getPlayerRating(userId);
    const currentSeason = await this.eloService.getCurrentSeason();

    const [lowerCount, totalCount] = await Promise.all([
      this.playerRatingRepository.count({
        where: {
          seasonId: currentSeason.seasonId,
          seasonStatus: SeasonStatus.ACTIVE,
          rating: LessThan(playerRating.rating),
        },
      }),
      this.playerRatingRepository.count({
        where: {
          seasonId: currentSeason.seasonId,
          seasonStatus: SeasonStatus.ACTIVE,
        },
      }),
    ]);

    if (totalCount === 0) return 100;
    return Math.round((lowerCount / totalCount) * 100);
  }

  /**
   * Return a player's own rating augmented with rank and percentile.
   */
  async getPlayerRatingWithDetails(userId: string): Promise<PlayerRatingDetails> {
    const [playerRating, rank, percentile] = await Promise.all([
      this.getPlayerRating(userId),
      this.getPlayerRank(userId),
      this.getPercentile(userId),
    ]);
    return { playerRating, rank, percentile };
  }

  /**
   * Return another player's rating if their privacy settings allow it.
   * Pass requestingUserId to bypass the check when a player views their own rating.
   */
  async getPublicPlayerRating(
    targetUserId: string,
    requestingUserId?: string,
  ): Promise<PlayerRatingDetails> {
    // Always allow self-access
    if (requestingUserId !== targetUserId) {
      const user = await this.userRepository.findOne({ where: { id: targetUserId } });
      if (!user) throw new NotFoundException('User not found');

      const showStats = user.preferences?.privacy?.showStats !== false; // default: visible
      if (!showStats) {
        throw new ForbiddenException('This player has set their rating to private');
      }
    }

    return this.getPlayerRatingWithDetails(targetUserId);
  }

  /**
   * Trigger a rating loss for an abandoned puzzle, but only when the player
   * has consumed at least 80 % of the time limit (they were genuinely engaged).
   * Returns null when the threshold is not met (no rating change).
   */
  async triggerAbandonRatingUpdate(
    input: AbandonRatingInput,
  ): Promise<PlayerRating | null> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: input.puzzleId },
    });
    if (!puzzle) throw new NotFoundException(`Puzzle not found: ${input.puzzleId}`);

    const timeLimit = puzzle.timeLimit || 300;
    if (input.timeTaken < ABANDON_TIME_THRESHOLD * timeLimit) {
      this.logger.log(
        `Abandon for user ${input.userId} on puzzle ${input.puzzleId} ignored — ` +
          `only ${input.timeTaken}s elapsed of ${timeLimit}s limit (< 80%)`,
      );
      return null;
    }

    return this.updateRatingOnPuzzleCompletion({
      userId: input.userId,
      puzzleId: input.puzzleId,
      puzzleDifficulty: puzzle.difficulty,
      difficultyRating: puzzle.difficultyRating || 5,
      wasCompleted: false,
      timeTaken: input.timeTaken,
      hintsUsed: input.hintsUsed,
      attempts: input.attempts,
      basePoints: puzzle.basePoints || 100,
    });
  }
}
