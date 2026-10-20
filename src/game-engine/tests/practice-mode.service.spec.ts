import { NotFoundException } from '@nestjs/common';
import { PracticeModeService } from '../services/practice-mode.service';
import { DifficultyLevel, PuzzleType } from '../types/puzzle.types';
import type { PracticeAttempt } from '../entities/practice-attempt.entity';
import type { PracticeSession } from '../entities/practice-session.entity';
import type { Puzzle } from '../../puzzles/entities/puzzle.entity';

describe('PracticeModeService', () => {
  let service: PracticeModeService;
  let sessions: {
    create: jest.Mock<PracticeSession, [Partial<PracticeSession>]>;
    save: jest.Mock<Promise<PracticeSession>, [PracticeSession]>;
    findOne: jest.Mock<
      Promise<PracticeSession | null>,
      [{ where: { id: string; playerId: string } }]
    >;
    find: jest.Mock<
      Promise<PracticeSession[]>,
      [{ where: { playerId: string } }]
    >;
  };
  let attempts: {
    create: jest.Mock<PracticeAttempt, [Partial<PracticeAttempt>]>;
    save: jest.Mock<Promise<PracticeAttempt>, [PracticeAttempt]>;
    find: jest.Mock<
      Promise<PracticeAttempt[]>,
      [
        {
          where: { practiceSessionId: string };
          order: { createdAt: 'DESC' };
          take: number;
        },
      ]
    >;
  };
  let puzzles: {
    findOne: jest.Mock<
      Promise<Puzzle | null>,
      [
        {
          where: {
            id: string;
            isActive: true;
            publishedAt: ReturnType<typeof import('typeorm').Not>;
          };
        },
      ]
    >;
  };
  let session: PracticeSession;
  let puzzle: Puzzle;

  const makeSession = () =>
    ({
      id: 'practice-1',
      playerId: 'player-1',
      puzzleId: 'puzzle-1',
      puzzleType: PuzzleType.SEQUENCE,
      difficulty: DifficultyLevel.MEDIUM,
      content: { question: 'What comes next?' },
      solution: { answer: 3 },
      hints: ['Find the pattern', 'Add two each time'],
      solutionGuide: 'The sequence increases by two.',
      attemptsCount: 0,
      correctAttempts: 0,
      hintsRequested: 0,
      replays: 0,
      totalTimeSpent: 0,
      completed: false,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PracticeSession);

  beforeEach(() => {
    session = makeSession();
    puzzle = {
      id: 'puzzle-1',
      title: 'Sequence',
      description: 'Continue the sequence.',
      category: 'sequence',
      difficultyRating: DifficultyLevel.MEDIUM,
      content: {
        type: 'fill-blank',
        question: 'What comes next?',
        correctAnswer: { answer: 3 },
        explanation: 'The sequence increases by two.',
      },
      hints: [
        { order: 2, text: 'Add two each time' },
        { order: 1, text: 'Find the pattern' },
      ],
      isActive: true,
      publishedAt: new Date(),
    } as Puzzle;
    sessions = {
      create: jest.fn((input: Partial<PracticeSession>) =>
        Object.assign(makeSession(), input),
      ),
      save: jest.fn((value: PracticeSession) => {
        if (!value.id) value.id = 'practice-1';
        return Promise.resolve(value);
      }),
      findOne: jest.fn(() => Promise.resolve(session)),
      find: jest.fn(() => Promise.resolve([session])),
    };
    attempts = {
      create: jest.fn(
        (input: Partial<PracticeAttempt>) => ({ ...input } as PracticeAttempt),
      ),
      save: jest.fn((value: PracticeAttempt) => Promise.resolve(value)),
      find: jest.fn(() => Promise.resolve<PracticeAttempt[]>([])),
    };
    puzzles = { findOne: jest.fn(() => Promise.resolve(puzzle)) };
    service = new PracticeModeService(
      sessions as never,
      attempts as never,
      puzzles as never,
    );
  });

  it('starts a separate practice session without exposing its solution', async () => {
    const result = await service.startPractice({
      playerId: 'player-1',
      puzzleId: 'puzzle-1',
    });

    expect(puzzles.findOne).toHaveBeenCalledTimes(1);
    expect(sessions.save).toHaveBeenCalledTimes(1);
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        solution: { answer: 3 },
        hints: ['Find the pattern', 'Add two each time'],
      }),
    );
    expect(result).not.toHaveProperty('content.correctAnswer');
    expect(result).not.toHaveProperty('content.explanation');
    expect(result).toMatchObject({
      mode: 'practice',
      ranked: false,
      rewardsEarned: false,
    });
    expect(result).not.toHaveProperty('solution');
  });

  it('rejects unpublished puzzles rather than accepting client-provided answers', async () => {
    puzzles.findOne.mockResolvedValue(null);
    await expect(
      service.startPractice({
        playerId: 'player-1',
        puzzleId: 'puzzle-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(sessions.save).not.toHaveBeenCalled();
  });

  it('records unlimited attempts and returns immediate feedback without rewards', async () => {
    for (let index = 0; index < 25; index += 1) {
      await service.submitAttempt('practice-1', 'player-1', 0);
    }
    const result = await service.submitAttempt('practice-1', 'player-1', {
      answer: 3,
    });

    expect(session.attemptsCount).toBe(26);
    expect(session.correctAttempts).toBe(1);
    expect(session.completed).toBe(true);
    expect(attempts.save).toHaveBeenCalledTimes(26);
    expect(result).toMatchObject({
      correct: true,
      attemptNumber: 26,
      ranked: false,
      rewardsEarned: false,
    });
  });

  it('compares structured answers independent of object key ordering', async () => {
    session.solution = { left: 1, right: { top: 2, bottom: 3 } };
    const result = await service.submitAttempt('practice-1', 'player-1', {
      right: { bottom: 3, top: 2 },
      left: 1,
    });

    expect(result).toMatchObject({ correct: true, completed: true });
  });

  it('normalizes text answers consistently with ranked puzzle validation', async () => {
    session.solution = 'Correct answer';
    const result = await service.submitAttempt(
      'practice-1',
      'player-1',
      ' correct ANSWER ',
    );

    expect(result).toMatchObject({ correct: true, completed: true });
  });

  it('returns progressive hints without consuming ranked hint allowances', async () => {
    const first = await service.getHint('practice-1', 'player-1', 1);
    const guide = await service.getHint('practice-1', 'player-1', 3);

    expect(first).toMatchObject({
      guidance: 'Find the pattern',
      isSolutionGuide: false,
      ranked: false,
      rewardsEarned: false,
    });
    expect(guide).toMatchObject({
      guidance: 'The sequence increases by two.',
      isSolutionGuide: true,
    });
    expect(session.hintsRequested).toBe(2);
  });

  it('tracks practice progress and recent attempt history', async () => {
    session.attemptsCount = 4;
    session.correctAttempts = 2;
    attempts.find.mockResolvedValue([
      { isCorrect: true, createdAt: new Date() } as PracticeAttempt,
    ]);
    const progress = await service.getProgress('practice-1', 'player-1');

    expect(progress).toMatchObject({
      attempts: 4,
      correctAttempts: 2,
      accuracy: 0.5,
    });
    expect(progress).toHaveProperty('recentAttempts');
  });

  it('replays without clearing accumulated practice progress', async () => {
    session.attemptsCount = 3;
    session.completed = true;
    const replay = await service.replay('practice-1', 'player-1');

    expect(session.attemptsCount).toBe(3);
    expect(session.replays).toBe(1);
    expect(session.completed).toBe(false);
    expect(replay).toMatchObject({ attempts: 3, replays: 1 });
  });

  it('allows difficulty adjustment and reports non-ranked practice analytics', async () => {
    await service.adjustDifficulty(
      'practice-1',
      'player-1',
      DifficultyLevel.HARD,
    );
    session.attemptsCount = 2;
    session.correctAttempts = 1;
    const analytics = await service.getPlayerAnalytics('player-1');

    expect(session.difficulty).toBe(DifficultyLevel.HARD);
    expect(analytics).toMatchObject({
      mode: 'practice',
      ranked: false,
      rewardsEarned: false,
      attempts: 2,
      correctAttempts: 1,
      accuracy: 0.5,
    });
  });

  it('does not allow another player to read a practice session', async () => {
    sessions.findOne.mockResolvedValue(null);
    await expect(
      service.getProgress('practice-1', 'player-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
