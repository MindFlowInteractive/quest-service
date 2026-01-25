import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEvent } from '../entities/player-event.entity';
import { EventReward } from '../entities/event-reward.entity';
import { SeasonalEvent } from '../entities/seasonal-event.entity';
import { EventPuzzle } from '../entities/event-puzzle.entity';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';

@Injectable()
export class PlayerEventService {
  private readonly logger = new Logger(PlayerEventService.name);

  constructor(
    @InjectRepository(PlayerEvent)
    private readonly playerEventRepository: Repository<PlayerEvent>,
    @InjectRepository(EventReward)
    private readonly rewardRepository: Repository<EventReward>,
    @InjectRepository(SeasonalEvent)
    private readonly eventRepository: Repository<SeasonalEvent>,
    @InjectRepository(EventPuzzle)
    private readonly puzzleRepository: Repository<EventPuzzle>,
  ) {}

  /**
   * Get or create player event record
   */
  async getOrCreatePlayerEvent(playerId: string, eventId: string): Promise<PlayerEvent> {
    let playerEvent = await this.playerEventRepository.findOne({
      where: { playerId, eventId },
    });

    if (!playerEvent) {
      // Verify event exists and is active
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      if (!event.isActive) {
        throw new BadRequestException('This event is not currently active');
      }

      playerEvent = this.playerEventRepository.create({
        playerId,
        eventId,
        firstJoinedAt: new Date(),
        lastActivityAt: new Date(),
      });

      playerEvent = await this.playerEventRepository.save(playerEvent);

      // Increment participant count
      await this.eventRepository.increment({ id: eventId }, 'participantCount', 1);

      this.logger.log(`Player ${playerId} joined event ${eventId}`);
    }

    return playerEvent;
  }

  /**
   * Submit puzzle answer and update player progress
   */
  async submitAnswer(
    playerId: string,
    eventId: string,
    submitAnswerDto: SubmitAnswerDto,
  ): Promise<{
    isCorrect: boolean;
    pointsEarned: number;
    newScore: number;
    rewardsEarned: any[];
    explanation?: string;
  }> {
    const { puzzleId, answer, timeTaken, hintsUsed } = submitAnswerDto;

    // Get or create player event
    const playerEvent = await this.getOrCreatePlayerEvent(playerId, eventId);

    // Check if puzzle already completed
    if (playerEvent.completedPuzzles.includes(puzzleId)) {
      throw new BadRequestException('Puzzle already completed');
    }

    // Get puzzle
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId, eventId },
      relations: ['event'],
    });

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${puzzleId} not found in this event`);
    }

    if (!puzzle.event.isActive) {
      throw new BadRequestException('This event is not currently active');
    }

    // Verify answer
    const correctAnswer = puzzle.content.correctAnswer;
    let isCorrect = false;

    if (Array.isArray(correctAnswer)) {
      isCorrect = JSON.stringify(correctAnswer.sort()) === JSON.stringify(answer.sort());
    } else if (typeof correctAnswer === 'string') {
      isCorrect = correctAnswer.toLowerCase().trim() === String(answer).toLowerCase().trim();
    } else {
      isCorrect = correctAnswer === answer;
    }

    // Update attempt count
    playerEvent.totalAttempts += 1;

    let pointsEarned = 0;
    let rewardsEarned: any[] = [];

    if (isCorrect) {
      // Calculate points
      pointsEarned = puzzle.rewardPoints;

      // Apply time bonus (if completed quickly)
      if (timeTaken && timeTaken < puzzle.timeLimit * 0.5) {
        const timeBonus = Math.floor(puzzle.rewardPoints * 0.2);
        pointsEarned += timeBonus;
      }

      // Apply hint penalty
      if (hintsUsed && hintsUsed > 0) {
        const hintPenalty = Math.floor(puzzle.rewardPoints * 0.1 * hintsUsed);
        pointsEarned = Math.max(0, pointsEarned - hintPenalty);
      }

      // Update player event
      playerEvent.score += pointsEarned;
      playerEvent.completedPuzzles.push(puzzleId);
      playerEvent.puzzlesCompleted += 1;
      playerEvent.correctAnswers += 1;
      playerEvent.currentStreak += 1;
      playerEvent.bestStreak = Math.max(playerEvent.bestStreak, playerEvent.currentStreak);

      if (hintsUsed) {
        playerEvent.hintsUsed += hintsUsed;
      }

      // Update category breakdown
      if (!playerEvent.statistics.categoryBreakdown) {
        playerEvent.statistics.categoryBreakdown = {};
      }
      playerEvent.statistics.categoryBreakdown[puzzle.category] =
        (playerEvent.statistics.categoryBreakdown[puzzle.category] || 0) + 1;

      // Update difficulty breakdown
      if (!playerEvent.statistics.difficultyBreakdown) {
        playerEvent.statistics.difficultyBreakdown = {};
      }
      playerEvent.statistics.difficultyBreakdown[puzzle.difficulty] =
        (playerEvent.statistics.difficultyBreakdown[puzzle.difficulty] || 0) + 1;

      // Update average completion time
      if (timeTaken) {
        const totalTime = playerEvent.averageCompletionTime * (playerEvent.puzzlesCompleted - 1);
        playerEvent.averageCompletionTime = Math.floor((totalTime + timeTaken) / playerEvent.puzzlesCompleted);
      }

      // Increment puzzle completion count
      await this.puzzleRepository.increment({ id: puzzleId }, 'completionCount', 1);

      // Increment event total puzzles completed
      await this.eventRepository.increment({ id: eventId }, 'totalPuzzlesCompleted', 1);

      // Check for rewards
      rewardsEarned = await this.checkAndAwardRewards(playerEvent);
    } else {
      // Reset streak on incorrect answer
      playerEvent.currentStreak = 0;
    }

    // Update last activity
    playerEvent.lastActivityAt = new Date();

    // Increment puzzle attempt count
    await this.puzzleRepository.increment({ id: puzzleId }, 'attemptCount', 1);

    // Save player event
    await this.playerEventRepository.save(playerEvent);

    return {
      isCorrect,
      pointsEarned,
      newScore: playerEvent.score,
      rewardsEarned,
      explanation: puzzle.content.explanation,
    };
  }

  /**
   * Check and award rewards based on score and puzzles completed
   */
  private async checkAndAwardRewards(playerEvent: PlayerEvent): Promise<any[]> {
    const rewards = await this.rewardRepository.find({
      where: {
        eventId: playerEvent.eventId,
        isActive: true,
      },
      order: { requiredScore: 'ASC' },
    });

    const newRewards: any[] = [];
    const earnedRewardIds = playerEvent.rewards.map((r) => r.rewardId);

    for (const reward of rewards) {
      // Skip if already earned
      if (earnedRewardIds.includes(reward.id)) {
        continue;
      }

      // Check if player qualifies
      const meetsScoreRequirement = playerEvent.score >= reward.requiredScore;
      const meetsPuzzleRequirement =
        !reward.requiredPuzzles || playerEvent.puzzlesCompleted >= reward.requiredPuzzles;

      if (meetsScoreRequirement && meetsPuzzleRequirement) {
        // Check max claims limit
        if (reward.maxClaims && reward.claimedCount >= reward.maxClaims) {
          continue;
        }

        // Award reward
        const rewardData = {
          rewardId: reward.id,
          rewardName: reward.name,
          rewardType: reward.type,
          earnedAt: new Date(),
        };

        playerEvent.rewards.push(rewardData);
        newRewards.push({
          ...rewardData,
          description: reward.description,
          rewardData: reward.rewardData,
        });

        // Increment claimed count
        await this.rewardRepository.increment({ id: reward.id }, 'claimedCount', 1);

        this.logger.log(
          `Player ${playerEvent.playerId} earned reward ${reward.name} in event ${playerEvent.eventId}`,
        );
      }
    }

    return newRewards;
  }

  /**
   * Get player's event progress
   */
  async getPlayerProgress(playerId: string, eventId: string): Promise<PlayerEvent> {
    const playerEvent = await this.playerEventRepository.findOne({
      where: { playerId, eventId },
      relations: ['event'],
    });

    if (!playerEvent) {
      throw new NotFoundException(`Player ${playerId} has not joined event ${eventId}`);
    }

    return playerEvent;
  }

  /**
   * Get all events a player has participated in
   */
  async getPlayerEvents(playerId: string): Promise<PlayerEvent[]> {
    return await this.playerEventRepository.find({
      where: { playerId },
      relations: ['event'],
      order: { lastActivityAt: 'DESC' },
    });
  }

  /**
   * Get player's rank in an event
   */
  async getPlayerRank(playerId: string, eventId: string): Promise<{
    rank: number;
    totalParticipants: number;
    percentile: number;
  }> {
    const playerEvent = await this.getPlayerProgress(playerId, eventId);

    // Get all player events for this event, ordered by score
    const allPlayerEvents = await this.playerEventRepository.find({
      where: { eventId },
      order: { score: 'DESC', puzzlesCompleted: 'DESC' },
    });

    const rank = allPlayerEvents.findIndex((pe) => pe.id === playerEvent.id) + 1;
    const totalParticipants = allPlayerEvents.length;
    const percentile = totalParticipants > 0 ? ((totalParticipants - rank + 1) / totalParticipants) * 100 : 0;

    return {
      rank,
      totalParticipants,
      percentile: Math.round(percentile * 100) / 100,
    };
  }
}
