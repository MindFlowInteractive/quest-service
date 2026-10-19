import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { PracticeAttempt } from '../entities/practice-attempt.entity';
import { PracticeSession } from '../entities/practice-session.entity';
import { DifficultyLevel, PuzzleType } from '../types/puzzle.types';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

export interface CreatePracticeSessionInput {
  playerId: string;
  puzzleId: string;
  difficulty?: DifficultyLevel;
}

const DEFAULT_HINTS = [
  'Identify the key information and constraints in the puzzle.',
  'Work through the problem one step at a time.',
  'Check your result against the puzzle goal.',
];

@Injectable()
export class PracticeModeService {
  constructor(
    @InjectRepository(PracticeSession)
    private readonly sessionRepository: Repository<PracticeSession>,
    @InjectRepository(PracticeAttempt)
    private readonly attemptRepository: Repository<PracticeAttempt>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
  ) {}

  async startPractice(
    input: CreatePracticeSessionInput,
  ): Promise<Record<string, unknown>> {
    if (
      !input ||
      typeof input.playerId !== 'string' ||
      !input.playerId ||
      typeof input.puzzleId !== 'string' ||
      !input.puzzleId
    ) {
      throw new BadRequestException('playerId and puzzleId are required');
    }
    if (
      input.difficulty !== undefined &&
      (!Number.isInteger(input.difficulty) ||
        input.difficulty < DifficultyLevel.BEGINNER ||
        input.difficulty > DifficultyLevel.IMPOSSIBLE)
    ) {
      throw new BadRequestException('Invalid puzzle difficulty');
    }

    const puzzle = await this.puzzleRepository.findOne({
      where: {
        id: input.puzzleId,
        isActive: true,
        publishedAt: Not(IsNull()),
      },
    });
    if (!puzzle) {
      throw new NotFoundException('Published puzzle not found');
    }
    const puzzleContent: Record<string, unknown> = puzzle.content;
    const solution = puzzleContent.correctAnswer;
    if (solution === undefined || solution === null) {
      throw new BadRequestException(
        'This puzzle does not have a solution for practice feedback',
      );
    }
    const content = { ...puzzleContent };
    delete content.correctAnswer;
    const solutionGuide =
      typeof content.explanation === 'string' ? content.explanation : undefined;
    delete content.explanation;
    const hints = puzzle.hints
      ?.slice()
      .sort((first, second) => first.order - second.order)
      .map((hint) => hint.text);

    const session = await this.sessionRepository.save(
      this.sessionRepository.create({
        playerId: input.playerId,
        puzzleId: puzzle.id,
        puzzleType: this.getPuzzleType(puzzle),
        difficulty:
          input.difficulty ??
          Math.min(
            Math.max(Math.round(puzzle.difficultyRating), 1),
            DifficultyLevel.IMPOSSIBLE,
          ),
        content: {
          title: puzzle.title,
          description: puzzle.description,
          ...content,
        },
        solution,
        hints: hints?.length ? hints : DEFAULT_HINTS,
        solutionGuide,
        startedAt: new Date(),
      }),
    );
    return this.toPublicSession(session);
  }

  async submitAttempt(
    practiceSessionId: string,
    playerId: string,
    answer: unknown,
  ): Promise<Record<string, unknown>> {
    const session = await this.getOwnedSession(practiceSessionId, playerId);
    const isCorrect = this.matchesSolution(answer, session.solution);

    await this.attemptRepository.save(
      this.attemptRepository.create({
        practiceSessionId: session.id,
        isCorrect,
      }),
    );

    const now = new Date();
    session.attemptsCount += 1;
    session.totalTimeSpent += Math.max(
      0,
      Math.floor((now.getTime() - session.startedAt.getTime()) / 1000),
    );
    session.startedAt = now;
    if (isCorrect) {
      session.correctAttempts += 1;
      session.completed = true;
    }
    await this.sessionRepository.save(session);

    return {
      practiceSessionId: session.id,
      correct: isCorrect,
      feedback: isCorrect
        ? 'Correct. You can keep practicing or replay this puzzle.'
        : 'Not quite. Review the puzzle guidance and try again.',
      attemptNumber: session.attemptsCount,
      completed: session.completed,
      ranked: false,
      rewardsEarned: false,
    };
  }

  async getProgress(
    practiceSessionId: string,
    playerId: string,
  ): Promise<Record<string, unknown>> {
    const session = await this.getOwnedSession(practiceSessionId, playerId);
    const recentAttempts = await this.attemptRepository.find({
      where: { practiceSessionId: session.id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      ...this.toPublicSession(session),
      recentAttempts: recentAttempts.map((attempt) => ({
        correct: attempt.isCorrect,
        timestamp: attempt.createdAt,
      })),
      accuracy:
        session.attemptsCount === 0
          ? 0
          : session.correctAttempts / session.attemptsCount,
    };
  }

  async getHint(
    practiceSessionId: string,
    playerId: string,
    level: number,
  ): Promise<Record<string, unknown>> {
    if (!Number.isInteger(level) || level < 1) {
      throw new BadRequestException('Hint level must be a positive integer');
    }

    const session = await this.getOwnedSession(practiceSessionId, playerId);
    const hintIndex = level - 1;
    let guidance: string;
    let isSolutionGuide = false;

    if (hintIndex < session.hints.length) {
      guidance = session.hints[hintIndex];
    } else if (session.solutionGuide) {
      guidance = session.solutionGuide;
      isSolutionGuide = true;
    } else {
      throw new NotFoundException('No guidance is available at this level');
    }

    session.hintsRequested += 1;
    await this.sessionRepository.save(session);

    return {
      level,
      guidance,
      isSolutionGuide,
      ranked: false,
      rewardsEarned: false,
    };
  }

  async replay(
    practiceSessionId: string,
    playerId: string,
  ): Promise<Record<string, unknown>> {
    const session = await this.getOwnedSession(practiceSessionId, playerId);
    session.replays += 1;
    session.completed = false;
    session.startedAt = new Date();
    await this.sessionRepository.save(session);
    return this.toPublicSession(session);
  }

  async adjustDifficulty(
    practiceSessionId: string,
    playerId: string,
    difficulty: DifficultyLevel,
  ): Promise<Record<string, unknown>> {
    if (
      !Number.isInteger(difficulty) ||
      difficulty < DifficultyLevel.BEGINNER ||
      difficulty > DifficultyLevel.IMPOSSIBLE
    ) {
      throw new BadRequestException('Invalid puzzle difficulty');
    }

    const session = await this.getOwnedSession(practiceSessionId, playerId);
    session.difficulty = difficulty;
    await this.sessionRepository.save(session);
    return this.toPublicSession(session);
  }

  async getPlayerAnalytics(playerId: string): Promise<Record<string, unknown>> {
    const sessions = await this.sessionRepository.find({ where: { playerId } });
    const totalAttempts = sessions.reduce(
      (total, session) => total + session.attemptsCount,
      0,
    );
    const correctAttempts = sessions.reduce(
      (total, session) => total + session.correctAttempts,
      0,
    );

    return {
      playerId,
      mode: 'practice',
      ranked: false,
      rewardsEarned: false,
      sessions: sessions.length,
      attempts: totalAttempts,
      correctAttempts,
      accuracy: totalAttempts === 0 ? 0 : correctAttempts / totalAttempts,
      hintsRequested: sessions.reduce(
        (total, session) => total + session.hintsRequested,
        0,
      ),
      replays: sessions.reduce((total, session) => total + session.replays, 0),
      totalTimeSpent: sessions.reduce(
        (total, session) => total + session.totalTimeSpent,
        0,
      ),
      difficulty: sessions.reduce((counts: Record<number, number>, session) => {
        counts[session.difficulty] = (counts[session.difficulty] || 0) + 1;
        return counts;
      }, {}),
    };
  }

  private async getOwnedSession(
    practiceSessionId: string,
    playerId: string,
  ): Promise<PracticeSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: practiceSessionId, playerId },
    });
    if (!session) {
      throw new NotFoundException('Practice session not found');
    }
    return session;
  }

  private getPuzzleType(puzzle: Puzzle): PuzzleType {
    const aliases: Record<string, PuzzleType> = {
      logic: PuzzleType.LOGIC_GRID,
      logic_grid: PuzzleType.LOGIC_GRID,
      'logic-grid': PuzzleType.LOGIC_GRID,
      sequence: PuzzleType.SEQUENCE,
      pattern: PuzzleType.PATTERN_MATCHING,
      pattern_matching: PuzzleType.PATTERN_MATCHING,
      spatial: PuzzleType.SPATIAL,
      math: PuzzleType.MATHEMATICAL,
      mathematical: PuzzleType.MATHEMATICAL,
      word: PuzzleType.WORD_PUZZLE,
      word_puzzle: PuzzleType.WORD_PUZZLE,
      custom: PuzzleType.CUSTOM,
    };
    const candidates = [puzzle.category, puzzle.content?.type]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.toLowerCase().replace(/\s+/g, '_'));

    for (const candidate of candidates) {
      const alias = aliases[candidate];
      if (alias) return alias;
    }
    return PuzzleType.CUSTOM;
  }

  private matchesSolution(answer: unknown, solution: unknown): boolean {
    return (
      JSON.stringify(this.normalize(answer)) ===
      JSON.stringify(this.normalize(solution))
    );
  }

  private normalize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalize(item));
    }
    if (value !== null && typeof value === 'object') {
      return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce((normalized: Record<string, unknown>, key) => {
          normalized[key] = this.normalize(
            (value as Record<string, unknown>)[key],
          );
          return normalized;
        }, {});
    }
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  }

  private toPublicSession(session: PracticeSession): Record<string, unknown> {
    return {
      id: session.id,
      playerId: session.playerId,
      puzzleId: session.puzzleId,
      puzzleType: session.puzzleType,
      difficulty: session.difficulty,
      content: session.content,
      mode: 'practice',
      ranked: false,
      rewardsEarned: false,
      attempts: session.attemptsCount,
      correctAttempts: session.correctAttempts,
      hintsRequested: session.hintsRequested,
      replays: session.replays,
      totalTimeSpent: session.totalTimeSpent,
      completed: session.completed,
    };
  }
}
