import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventPuzzle } from '../entities/event-puzzle.entity';
import { SeasonalEvent } from '../entities/seasonal-event.entity';
import { CreatePuzzleDto } from '../dto/create-puzzle.dto';

@Injectable()
export class EventPuzzleService {
  constructor(
    @InjectRepository(EventPuzzle)
    private readonly puzzleRepository: Repository<EventPuzzle>,
    @InjectRepository(SeasonalEvent)
    private readonly eventRepository: Repository<SeasonalEvent>,
  ) {}

  /**
   * Create a new puzzle for an event
   */
  async createPuzzle(createPuzzleDto: CreatePuzzleDto): Promise<EventPuzzle> {
    // Verify event exists
    const event = await this.eventRepository.findOne({
      where: { id: createPuzzleDto.eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${createPuzzleDto.eventId} not found`);
    }

    const puzzle = this.puzzleRepository.create({
      ...createPuzzleDto,
      difficulty: createPuzzleDto.difficulty || 'medium',
      rewardPoints: createPuzzleDto.rewardPoints || 100,
      timeLimit: createPuzzleDto.timeLimit || 300,
      maxAttempts: createPuzzleDto.maxAttempts || 3,
    });

    return await this.puzzleRepository.save(puzzle);
  }

  /**
   * Get all puzzles for an event (only if event is active)
   */
  async findPuzzlesByEvent(eventId: string, includeInactive: boolean = false): Promise<EventPuzzle[]> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if event is active
    if (!event.isActive && !includeInactive) {
      throw new ForbiddenException('This event is not currently active');
    }

    const where: any = { eventId };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.puzzleRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get puzzles by category for an active event
   */
  async findPuzzlesByCategory(eventId: string, category: string): Promise<EventPuzzle[]> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (!event.isActive) {
      throw new ForbiddenException('This event is not currently active');
    }

    return await this.puzzleRepository.find({
      where: {
        eventId,
        category,
        isActive: true,
      },
      order: { difficulty: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Get a single puzzle by ID (only if event is active)
   */
  async findOne(puzzleId: string): Promise<EventPuzzle> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
      relations: ['event'],
    });

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${puzzleId} not found`);
    }

    if (!puzzle.event.isActive) {
      throw new ForbiddenException('This puzzle belongs to an inactive event');
    }

    return puzzle;
  }

  /**
   * Verify puzzle answer
   */
  async verifyAnswer(puzzleId: string, userAnswer: any): Promise<{
    isCorrect: boolean;
    correctAnswer?: any;
    explanation?: string;
  }> {
    const puzzle = await this.findOne(puzzleId);

    // Increment attempt count
    await this.puzzleRepository.increment({ id: puzzleId }, 'attemptCount', 1);

    const correctAnswer = puzzle.content.correctAnswer;
    let isCorrect = false;

    // Compare answers based on type
    if (Array.isArray(correctAnswer)) {
      isCorrect = JSON.stringify(correctAnswer.sort()) === JSON.stringify(userAnswer.sort());
    } else if (typeof correctAnswer === 'string') {
      isCorrect = correctAnswer.toLowerCase().trim() === String(userAnswer).toLowerCase().trim();
    } else {
      isCorrect = correctAnswer === userAnswer;
    }

    // Increment completion count if correct
    if (isCorrect) {
      await this.puzzleRepository.increment({ id: puzzleId }, 'completionCount', 1);
    }

    return {
      isCorrect,
      correctAnswer: isCorrect ? undefined : correctAnswer,
      explanation: puzzle.content.explanation,
    };
  }

  /**
   * Update a puzzle
   */
  async updatePuzzle(puzzleId: string, updateData: Partial<CreatePuzzleDto>): Promise<EventPuzzle> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    });

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${puzzleId} not found`);
    }

    Object.assign(puzzle, updateData);
    return await this.puzzleRepository.save(puzzle);
  }

  /**
   * Delete a puzzle
   */
  async deletePuzzle(puzzleId: string): Promise<void> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    });

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${puzzleId} not found`);
    }

    await this.puzzleRepository.remove(puzzle);
  }

  /**
   * Get puzzle statistics
   */
  async getPuzzleStatistics(puzzleId: string): Promise<{
    puzzle: EventPuzzle;
    stats: {
      completionRate: number;
      averageAttempts: number;
    };
  }> {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: puzzleId },
    });

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${puzzleId} not found`);
    }

    const completionRate =
      puzzle.attemptCount > 0
        ? (puzzle.completionCount / puzzle.attemptCount) * 100
        : 0;

    const averageAttempts =
      puzzle.completionCount > 0
        ? puzzle.attemptCount / puzzle.completionCount
        : 0;

    return {
      puzzle,
      stats: {
        completionRate: Math.round(completionRate * 100) / 100,
        averageAttempts: Math.round(averageAttempts * 100) / 100,
      },
    };
  }

  /**
   * Get all categories for an event
   */
  async getEventCategories(eventId: string): Promise<string[]> {
    const puzzles = await this.findPuzzlesByEvent(eventId);
    const categories = [...new Set(puzzles.map((p) => p.category))];
    return categories.sort();
  }
}
