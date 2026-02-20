import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
    ConflictException,
    NotFoundException,
    TooManyRequestsException,
} from '@nestjs/common';
import { SolutionSubmissionService } from '../services/solution-submission.service';
import { Puzzle } from '../entities/puzzle.entity';
import {
    PuzzleSolutionAttempt,
    SolutionAttemptStatus,
} from '../entities/puzzle-solution-attempt.entity';
import { AntiCheatService } from '../../anti-cheat/services/anti-cheat.service';
import { SubmitSolutionDto } from '../dto/submit-solution.dto';
import { v4 as uuidv4 } from 'uuid';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function makeNonce() {
    return uuidv4();
}

function makeSessionStart(secondsAgo: number): string {
    return new Date(Date.now() - secondsAgo * 1000).toISOString();
}

function makeDto(overrides: Partial<SubmitSolutionDto> = {}): SubmitSolutionDto {
    return {
        answer: 'correct_answer',
        nonce: makeNonce(),
        sessionStartedAt: makeSessionStart(30), // 30 seconds ago by default
        hintsUsed: 0,
        ...overrides,
    } as SubmitSolutionDto;
}

// ──────────────────────────────────────────────────────────────────────────────
// Mock Factories
// ──────────────────────────────────────────────────────────────────────────────

const basePuzzle: Partial<Puzzle> = {
    id: 'puzzle-uuid-001',
    title: 'Test Puzzle',
    content: {
        type: 'multiple-choice',
        correctAnswer: 'correct_answer',
        explanation: 'Because it is correct.',
    },
    basePoints: 100,
    timeLimit: 300, // 5 minutes
    difficultyRating: 5,
    attempts: 0,
    completions: 0,
    averageCompletionTime: 0,
    difficulty: 'medium',
};

function makePuzzleRepo(puzzle: Partial<Puzzle> | null = basePuzzle) {
    return {
        findOne: jest.fn().mockResolvedValue(puzzle),
        increment: jest.fn().mockResolvedValue(undefined),
    };
}

function makeAttemptRepo(existingNonce: PuzzleSolutionAttempt | null = null, recentCount = 0) {
    return {
        findOne: jest.fn().mockResolvedValue(existingNonce),
        count: jest.fn().mockResolvedValue(recentCount),
        find: jest.fn().mockResolvedValue([]),
        findAndCount: jest.fn().mockResolvedValue([[], 0]),
        create: jest.fn().mockImplementation((entity) => entity),
        save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'attempt-id-001', ...entity })),
    };
}

function makeDataSource(saved?: Partial<PuzzleSolutionAttempt>) {
    const savedAttempt = saved ?? { id: 'attempt-id-001', status: SolutionAttemptStatus.CORRECT };
    return {
        transaction: jest.fn().mockImplementation(async (cb: Function) => {
            const manager = {
                create: jest.fn().mockImplementation((_Entity, data) => data),
                save: jest.fn().mockImplementation((_Entity, data) =>
                    Promise.resolve({ id: 'attempt-id-001', ...data }),
                ),
            };
            return cb(manager);
        }),
    };
}

function makeAntiCheatService() {
    return {
        analyzeMoveSequence: jest.fn().mockResolvedValue(undefined),
        updateBehaviorProfile: jest.fn().mockResolvedValue(undefined),
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// Test Suite
// ──────────────────────────────────────────────────────────────────────────────

describe('SolutionSubmissionService', () => {
    let service: SolutionSubmissionService;
    let puzzleRepo: ReturnType<typeof makePuzzleRepo>;
    let attemptRepo: ReturnType<typeof makeAttemptRepo>;
    let dataSource: ReturnType<typeof makeDataSource>;
    let antiCheatService: ReturnType<typeof makeAntiCheatService>;

    async function buildService(
        puzzle: Partial<Puzzle> | null = basePuzzle,
        existingNonce: PuzzleSolutionAttempt | null = null,
        recentSubmissionCount = 0,
    ) {
        puzzleRepo = makePuzzleRepo(puzzle);
        attemptRepo = makeAttemptRepo(existingNonce, recentSubmissionCount);
        dataSource = makeDataSource();
        antiCheatService = makeAntiCheatService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SolutionSubmissionService,
                { provide: getRepositoryToken(Puzzle), useValue: puzzleRepo },
                { provide: getRepositoryToken(PuzzleSolutionAttempt), useValue: attemptRepo },
                { provide: DataSource, useValue: dataSource },
                { provide: AntiCheatService, useValue: antiCheatService },
            ],
        }).compile();

        service = module.get<SolutionSubmissionService>(SolutionSubmissionService);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Happy Path
    // ────────────────────────────────────────────────────────────────────────────

    describe('✅ Correct answer submission', () => {
        beforeEach(() => buildService());

        it('returns CORRECT status when answer matches', async () => {
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto());
            expect(result.status).toBe(SolutionAttemptStatus.CORRECT);
            expect(result.isCorrect).toBe(true);
        });

        it('provides reward data on correct submission', async () => {
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto());
            expect(result.rewards).toBeDefined();
            expect(result.rewards!.totalScore).toBeGreaterThan(0);
            expect(result.rewards!.baseScore).toBe(100);
        });

        it('includes puzzle explanation on correct submission', async () => {
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto());
            expect(result.explanation).toBe('Because it is correct.');
        });

        it('correctly calculates time bonus for fast submissions', async () => {
            // 30s elapsed out of 300s limit → should get a time bonus
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ sessionStartedAt: makeSessionStart(30) }));
            expect(result.rewards!.timeBonus).toBeGreaterThan(0);
        });

        it('awards independent_thinker achievement when no hints used', async () => {
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ hintsUsed: 0 }));
            expect(result.rewards!.achievements).toContain('independent_thinker');
        });

        it('awards speed_demon achievement when solved in < 30% of time limit', async () => {
            // Time limit is 300s, 30% = 90s, so if we complete in 20s we should get speed_demon
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ sessionStartedAt: makeSessionStart(20) }));
            expect(result.rewards!.achievements).toContain('speed_demon');
        });

        it('runs inside a transaction', async () => {
            await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto());
            expect(dataSource.transaction).toHaveBeenCalledTimes(1);
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Wrong Answer
    // ────────────────────────────────────────────────────────────────────────────

    describe('❌ Wrong answer submission', () => {
        beforeEach(() => buildService());

        it('returns INCORRECT status for wrong answer', async () => {
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ answer: 'wrong_answer' }),
            );
            expect(result.status).toBe(SolutionAttemptStatus.INCORRECT);
            expect(result.isCorrect).toBe(false);
        });

        it('awards zero score for incorrect answer', async () => {
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ answer: 'wrong_answer' }),
            );
            expect(result.rewards).toBeUndefined();
        });

        it('provides a helpful message for wrong answers', async () => {
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ answer: 'wrong_answer' }),
            );
            expect(result.message).toBeTruthy();
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Anti-Replay
    // ────────────────────────────────────────────────────────────────────────────

    describe('🔒 Anti-replay: duplicate nonce', () => {
        it('throws ConflictException when nonce already used', async () => {
            const usedNonce = makeNonce();
            // Simulate DB returning an existing attempt with this nonce
            await buildService(basePuzzle, { id: 'old-attempt', nonce: usedNonce } as PuzzleSolutionAttempt);

            await expect(
                service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ nonce: usedNonce })),
            ).rejects.toThrow(ConflictException);
        });

        it('ConflictException message mentions nonce', async () => {
            const usedNonce = makeNonce();
            await buildService(basePuzzle, { id: 'old-attempt', nonce: usedNonce } as PuzzleSolutionAttempt);

            await expect(
                service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ nonce: usedNonce })),
            ).rejects.toThrow(/nonce/i);
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Time Limit
    // ────────────────────────────────────────────────────────────────────────────

    describe('⏰ Time limit validation', () => {
        it('returns TIMEOUT when session started beyond timeLimit', async () => {
            await buildService();
            // puzzle timeLimit = 300s, started 400s ago
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(400) }),
            );
            expect(result.status).toBe(SolutionAttemptStatus.TIMEOUT);
            expect(result.isCorrect).toBe(false);
        });

        it('includes elapsed time in timeout response', async () => {
            await buildService();
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(400) }),
            );
            expect(result.timeTakenSeconds).toBeGreaterThanOrEqual(399);
        });

        it('increments attempts even on timeout', async () => {
            await buildService();
            await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(400) }),
            );
            expect(puzzleRepo.increment).toHaveBeenCalledWith({ id: 'puzzle-uuid-001' }, 'attempts', 1);
        });

        it('accepts submission just within time limit', async () => {
            await buildService();
            // 295s elapsed, limit is 300s — should succeed
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(295) }),
            );
            expect(result.status).not.toBe(SolutionAttemptStatus.TIMEOUT);
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Fraud Detection — Too Fast
    // ────────────────────────────────────────────────────────────────────────────

    describe('🚨 Fraud detection: impossibly fast completion', () => {
        it('flags FRAUD_DETECTED when completed faster than minimum expected time', async () => {
            await buildService();
            // difficultyRating = 5, min = 5*5 = 25s; we submit after just 2s → fraud
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(2) }),
            );
            expect(result.status).toBe(SolutionAttemptStatus.FRAUD_DETECTED);
            expect(result.isCorrect).toBe(false);
        });

        it('does not award rewards when fraud is detected', async () => {
            await buildService();
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(2) }),
            );
            expect(result.rewards).toBeUndefined();
        });

        it('notifies AntiCheatService on fraud detection', async () => {
            await buildService();
            await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(2) }),
            );
            expect(antiCheatService.updateBehaviorProfile).toHaveBeenCalledWith(
                'user-1',
                expect.objectContaining({ violationDetected: true }),
            );
        });

        it('includes fraud message in response', async () => {
            await buildService();
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(2) }),
            );
            expect(result.message).toMatch(/anti-cheat/i);
        });

        it('allows legitimate fast runs (above minimum threshold)', async () => {
            await buildService();
            // 30s elapsed, min = 25s → should not be flagged
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ sessionStartedAt: makeSessionStart(30) }),
            );
            expect(result.status).not.toBe(SolutionAttemptStatus.FRAUD_DETECTED);
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Rate Limiting
    // ────────────────────────────────────────────────────────────────────────────

    describe('⚠️ Rate limiting', () => {
        it('throws TooManyRequestsException when rate limit is exceeded', async () => {
            // 5 existing submissions in the last 60s → 6th should be rejected
            await buildService(basePuzzle, null, 5);

            await expect(
                service.submitSolution('user-1', 'puzzle-uuid-001', makeDto()),
            ).rejects.toThrow(TooManyRequestsException);
        });

        it('allows submission when under rate limit', async () => {
            await buildService(basePuzzle, null, 4); // 4 < 5 → allowed
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto());
            expect(result.submissionId).toBeDefined();
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Puzzle Not Found
    // ────────────────────────────────────────────────────────────────────────────

    describe('🔍 Puzzle not found', () => {
        it('throws NotFoundException when puzzle does not exist', async () => {
            await buildService(null); // findOne returns null
            await expect(
                service.submitSolution('user-1', 'nonexistent-id', makeDto()),
            ).rejects.toThrow(NotFoundException);
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Hint Penalty
    // ────────────────────────────────────────────────────────────────────────────

    describe('💡 Hint penalty scoring', () => {
        beforeEach(() => buildService());

        it('reduces score when hints are used', async () => {
            const noHints = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ hintsUsed: 0 }));
            const withHints = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ hintsUsed: 2 }));

            expect(withHints.rewards!.totalScore).toBeLessThan(noHints.rewards!.totalScore);
        });

        it('hintPenalty is negative in reward breakdown', async () => {
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ hintsUsed: 2 }));
            expect(result.rewards!.hintPenalty).toBeLessThan(0);
        });

        it('does NOT award independent_thinker achievement when hints used', async () => {
            const result = await service.submitSolution('user-1', 'puzzle-uuid-001', makeDto({ hintsUsed: 1 }));
            expect(result.rewards!.achievements).not.toContain('independent_thinker');
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Answer Normalisation
    // ────────────────────────────────────────────────────────────────────────────

    describe('🔑 Answer normalisation (hash comparison)', () => {
        it('accepts answer with different key ordering (object normalisation)', async () => {
            // correctAnswer = 'correct_answer' (string) — test object answer normalisation
            const objectPuzzle = {
                ...basePuzzle,
                content: { type: 'logic-grid', correctAnswer: { b: 2, a: 1 }, explanation: '' },
            };
            await buildService(objectPuzzle as any);

            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ answer: { a: 1, b: 2 } }), // same values, different key order
            );
            expect(result.isCorrect).toBe(true);
        });

        it('is case-insensitive for string answers', async () => {
            await buildService();
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ answer: 'CORRECT_ANSWER' }),
            );
            expect(result.isCorrect).toBe(true);
        });

        it('ignores surrounding whitespace in string answers', async () => {
            await buildService();
            const result = await service.submitSolution(
                'user-1',
                'puzzle-uuid-001',
                makeDto({ answer: '  correct_answer  ' }),
            );
            expect(result.isCorrect).toBe(true);
        });
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Submission History
    // ────────────────────────────────────────────────────────────────────────────

    describe('📜 Submission history', () => {
        it('returns paginated history for a user', async () => {
            await buildService();
            attemptRepo.findAndCount.mockResolvedValue([
                [{ id: 'a1', status: SolutionAttemptStatus.CORRECT, scoreAwarded: 100 }],
                1,
            ]);
            const history = await service.getSubmissionHistory('user-1', undefined, 1, 20);
            expect(history.items).toHaveLength(1);
            expect(history.total).toBe(1);
            expect(history.totalPages).toBe(1);
        });

        it('filters history by puzzleId when provided', async () => {
            await buildService();
            attemptRepo.findAndCount.mockResolvedValue([[], 0]);
            await service.getSubmissionHistory('user-1', 'puzzle-uuid-001', 1, 20);

            expect(attemptRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ puzzleId: 'puzzle-uuid-001' }),
                }),
            );
        });

        it('returns empty list when no attempts exist', async () => {
            await buildService();
            const history = await service.getSubmissionHistory('user-1');
            expect(history.items).toHaveLength(0);
            expect(history.total).toBe(0);
        });
    });
});
