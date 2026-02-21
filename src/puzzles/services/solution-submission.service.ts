import {
    Injectable,
    Logger,
    ConflictException,
    BadRequestException,
    NotFoundException,
    TooManyRequestsException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { Puzzle } from '../entities/puzzle.entity';
import {
    PuzzleSolutionAttempt,
    SolutionAttemptStatus,
} from '../entities/puzzle-solution-attempt.entity';
import { SubmitSolutionDto } from '../dto/submit-solution.dto';
import {
    SubmissionResultDto,
    SubmissionHistoryDto,
    RewardBreakdownDto,
} from '../dto/submission-result.dto';
import { AntiCheatService } from '../../anti-cheat/services/anti-cheat.service';
import { ViolationType } from '../../anti-cheat/constants';

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

/** Minimum believable completion time per difficulty rating unit (seconds). */
const MIN_SECONDS_PER_DIFFICULTY_UNIT = 5;

/** Submissions allowed per USER per 60-second window. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

// ────────────────────────────────────────────────────────────────────────────

@Injectable()
export class SolutionSubmissionService {
    private readonly logger = new Logger(SolutionSubmissionService.name);

    constructor(
        @InjectRepository(Puzzle)
        private readonly puzzleRepo: Repository<Puzzle>,

        @InjectRepository(PuzzleSolutionAttempt)
        private readonly attemptRepo: Repository<PuzzleSolutionAttempt>,

        private readonly dataSource: DataSource,
        private readonly antiCheatService: AntiCheatService,
    ) { }

    // ──────────────────────────────────────────────────────────────────────────
    // Public API
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Main entry point — verifies, records, and rewards a puzzle solution submission.
     *
     * Steps:
     * 1. Rate-limit check
     * 2. Anti-replay (nonce uniqueness)
     * 3. Puzzle lookup
     * 4. Timing validation (is time limit exceeded?)
     * 5. Answer verification (hash comparison)
     * 6. Fraud / anti-cheat detection
     * 7. Reward calculation (if correct)
     * 8. Atomic DB transaction (attempt insert + puzzle stats update)
     */
    async submitSolution(
        userId: string,
        puzzleId: string,
        dto: SubmitSolutionDto,
        ipAddress?: string,
    ): Promise<SubmissionResultDto> {
        // 1. Rate limit
        await this.enforceRateLimit(userId);

        // 2. Anti-replay
        await this.checkAntiReplay(dto.nonce);

        // 3. Load puzzle
        const puzzle = await this.puzzleRepo.findOne({ where: { id: puzzleId } });
        if (!puzzle) {
            throw new NotFoundException(`Puzzle ${puzzleId} not found`);
        }

        const sessionStartedAt = new Date(dto.sessionStartedAt);
        const now = new Date();
        const timeTakenSeconds = Math.floor(
            (now.getTime() - sessionStartedAt.getTime()) / 1000,
        );

        // 4. Time limit check
        if (puzzle.timeLimit && timeTakenSeconds > puzzle.timeLimit) {
            const attempt = await this.persistAttempt({
                userId,
                puzzleId,
                nonce: dto.nonce,
                answer: dto.answer,
                status: SolutionAttemptStatus.TIMEOUT,
                sessionStartedAt,
                timeTakenSeconds,
                hintsUsed: dto.hintsUsed ?? 0,
                scoreAwarded: 0,
                rewardData: {},
                fraudFlags: {},
                ipAddress,
                metadata: dto.clientMetadata ?? {},
            });

            await this.incrementAttempts(puzzle);

            return {
                submissionId: attempt.id,
                status: SolutionAttemptStatus.TIMEOUT,
                isCorrect: false,
                timeTakenSeconds,
                message: `Time limit of ${puzzle.timeLimit}s exceeded (took ${timeTakenSeconds}s).`,
            };
        }

        // 5. Verify answer
        const isCorrect = this.verifyAnswer(puzzle, dto.answer);

        // 6. Fraud detection
        const fraudResult = await this.detectFraud(
            userId,
            puzzleId,
            timeTakenSeconds,
            puzzle.difficultyRating,
        );

        const finalStatus = fraudResult.isFraud
            ? SolutionAttemptStatus.FRAUD_DETECTED
            : isCorrect
                ? SolutionAttemptStatus.CORRECT
                : SolutionAttemptStatus.INCORRECT;

        // 7. Reward calculation (only for legitimate correct answers)
        let rewardData: RewardBreakdownDto | undefined;
        let scoreAwarded = 0;

        if (isCorrect && !fraudResult.isFraud) {
            rewardData = this.calculateRewards(puzzle, timeTakenSeconds, dto.hintsUsed ?? 0);
            scoreAwarded = rewardData.totalScore;
        }

        // 8. Atomic transaction
        const attempt = await this.dataSource.transaction(async (manager) => {
            // Insert attempt record
            const newAttempt = manager.create(PuzzleSolutionAttempt, {
                userId,
                puzzleId,
                nonce: dto.nonce,
                answerHash: this.hashAnswer(dto.answer),
                status: finalStatus,
                sessionStartedAt,
                timeTakenSeconds,
                hintsUsed: dto.hintsUsed ?? 0,
                scoreAwarded,
                rewardData: rewardData ?? {},
                fraudFlags: fraudResult.flags,
                ipAddress,
                metadata: dto.clientMetadata ?? {},
            });
            const saved = await manager.save(PuzzleSolutionAttempt, newAttempt);

            // Update puzzle aggregate stats
            puzzle.attempts = (puzzle.attempts ?? 0) + 1;
            if (isCorrect && !fraudResult.isFraud) {
                puzzle.completions = (puzzle.completions ?? 0) + 1;

                // Rolling average completion time
                const prevTotal =
                    (puzzle.averageCompletionTime ?? 0) * (puzzle.completions - 1);
                puzzle.averageCompletionTime = Math.floor(
                    (prevTotal + timeTakenSeconds) / puzzle.completions,
                );
            }
            await manager.save(Puzzle, puzzle);

            return saved;
        });

        this.logger.log(
            `Submission ${attempt.id}: user=${userId} puzzle=${puzzleId} ` +
            `status=${finalStatus} score=${scoreAwarded} time=${timeTakenSeconds}s`,
        );

        const result: SubmissionResultDto = {
            submissionId: attempt.id,
            status: finalStatus,
            isCorrect: isCorrect && !fraudResult.isFraud,
            timeTakenSeconds,
            rewards: rewardData,
            explanation: isCorrect ? (puzzle.content?.explanation ?? undefined) : undefined,
        };

        if (fraudResult.isFraud) {
            result.message =
                'Submission flagged by anti-cheat. Score not awarded pending review.';
        } else if (!isCorrect) {
            result.message = 'Incorrect answer. Please try again.';
        }

        return result;
    }

    /**
     * Returns paginated submission history for a user, optionally filtered to a
     * specific puzzle.
     */
    async getSubmissionHistory(
        userId: string,
        puzzleId?: string,
        page = 1,
        limit = 20,
    ): Promise<SubmissionHistoryDto> {
        const where: any = { userId };
        if (puzzleId) where.puzzleId = puzzleId;

        const [items, total] = await this.attemptRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            select: [
                'id',
                'puzzleId',
                'status',
                'timeTakenSeconds',
                'scoreAwarded',
                'hintsUsed',
                'createdAt',
            ],
        });

        return {
            items: items as any,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private Helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Enforce a per-user submission rate limit:
     * max {@link RATE_LIMIT_MAX} submissions in the last {@link RATE_LIMIT_WINDOW_MS}ms.
     */
    private async enforceRateLimit(userId: string): Promise<void> {
        const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
        const recentCount = await this.attemptRepo.count({
            where: {
                userId,
                createdAt: MoreThan(windowStart),
            },
        });

        if (recentCount >= RATE_LIMIT_MAX) {
            this.logger.warn(`Rate limit hit for user ${userId}: ${recentCount} submissions in last 60s`);
            throw new TooManyRequestsException(
                `You have exceeded the submission rate limit (${RATE_LIMIT_MAX} per minute). Please wait before trying again.`,
            );
        }
    }

    /**
     * Ensure the nonce has never been used before.
     * A unique DB constraint is the source of truth; this pre-check provides
     * a human-readable error before hitting the constraint.
     */
    private async checkAntiReplay(nonce: string): Promise<void> {
        const existing = await this.attemptRepo.findOne({ where: { nonce } });
        if (existing) {
            this.logger.warn(`Replay attack detected — nonce already used: ${nonce}`);
            throw new ConflictException(
                'This submission token (nonce) has already been used. Each submission must have a unique nonce.',
            );
        }
    }

    /**
     * Normalise and SHA-256 hash an answer for safe storage and comparison.
     * Normalisation ensures {a:1, b:2} and {b:2, a:1} produce identical hashes.
     */
    private hashAnswer(answer: any): string {
        const normalised = this.normaliseAnswer(answer);
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(normalised))
            .digest('hex');
    }

    /**
     * Recursively sort object keys so hash comparison is order-independent.
     */
    private normaliseAnswer(value: any): any {
        if (Array.isArray(value)) {
            return value.map((v) => this.normaliseAnswer(v));
        }
        if (value !== null && typeof value === 'object') {
            return Object.keys(value)
                .sort()
                .reduce<Record<string, any>>((acc, key) => {
                    acc[key] = this.normaliseAnswer(value[key]);
                    return acc;
                }, {});
        }
        // Normalise strings: trim and lower-case to avoid trivial bypass
        if (typeof value === 'string') {
            return value.trim().toLowerCase();
        }
        return value;
    }

    /**
     * Compare submitted answer against the puzzle's stored correct answer.
     * Uses hash comparison — never compares plaintext.
     */
    private verifyAnswer(puzzle: Puzzle, submittedAnswer: any): boolean {
        const correctAnswer = puzzle.content?.correctAnswer;
        if (correctAnswer === undefined || correctAnswer === null) {
            // Puzzle has no defined correct answer — cannot verify
            this.logger.warn(`Puzzle ${puzzle.id} has no correctAnswer defined`);
            return false;
        }

        const submittedHash = this.hashAnswer(submittedAnswer);
        const correctHash = this.hashAnswer(correctAnswer);
        return submittedHash === correctHash;
    }

    /**
     * Detect abnormally fast completions and dispatch to the anti-cheat service.
     *
     * A completion time below `difficultyRating * MIN_SECONDS_PER_DIFFICULTY_UNIT`
     * seconds is considered impossibly fast and flagged.
     */
    private async detectFraud(
        userId: string,
        puzzleId: string,
        timeTakenSeconds: number,
        difficultyRating: number,
    ): Promise<{
        isFraud: boolean;
        flags: PuzzleSolutionAttempt['fraudFlags'];
    }> {
        const minExpectedSeconds = difficultyRating * MIN_SECONDS_PER_DIFFICULTY_UNIT;
        const tooFast = timeTakenSeconds < minExpectedSeconds;

        const flags: PuzzleSolutionAttempt['fraudFlags'] = {
            tooFast,
            minExpectedSeconds,
            actualSeconds: timeTakenSeconds,
            violationTypes: [],
            riskScore: 0,
        };

        if (tooFast) {
            flags.violationTypes = [ViolationType.IMPOSSIBLY_FAST_COMPLETION];
            flags.riskScore = Math.min(
                100,
                Math.round((1 - timeTakenSeconds / minExpectedSeconds) * 100),
            );

            // Notify the anti-cheat module so it can update the player's profile
            try {
                await this.antiCheatService.analyzeMoveSequence(
                    userId,
                    puzzleId,
                    `submission-${Date.now()}`,
                    [],
                    {
                        isFirstAttempt: true,
                        allMovesValid: false,
                    },
                );
                await this.antiCheatService.updateBehaviorProfile(userId, {
                    violationDetected: true,
                    violationTypes: [ViolationType.IMPOSSIBLY_FAST_COMPLETION],
                });
            } catch (err: any) {
                this.logger.error(`Anti-cheat notification failed: ${err.message}`);
            }

            this.logger.warn(
                `Fraud detected: user=${userId} puzzle=${puzzleId} ` +
                `time=${timeTakenSeconds}s (min expected=${minExpectedSeconds}s)`,
            );
        }

        return { isFraud: tooFast, flags };
    }

    /**
     * Calculate score and rewards for a correct, non-fraudulent submission.
     *
     * Formula:
     *   base  = puzzle.basePoints
     *   time  = up to 50% of base, linear based on time remaining vs time limit
     *   hints = −10% of base per hint used
     *   first = +25% of base if this is the user's first correct solve
     */
    private calculateRewards(
        puzzle: Puzzle,
        timeTakenSeconds: number,
        hintsUsed: number,
    ): RewardBreakdownDto {
        const baseScore = puzzle.basePoints ?? 100;

        // Time bonus: linear — faster = more bonus
        let timeBonus = 0;
        if (puzzle.timeLimit && puzzle.timeLimit > 0) {
            const timeRemaining = puzzle.timeLimit - timeTakenSeconds;
            if (timeRemaining > 0) {
                timeBonus = Math.round((timeRemaining / puzzle.timeLimit) * baseScore * 0.5);
            }
        }

        // Hint penalty: 10% of base per hint
        const hintPenalty = Math.round(hintsUsed * baseScore * 0.1);

        // Streak bonus placeholder (server would pull user's streak from their profile)
        const streakBonus = 0;

        // First-solve bonus
        const firstSolveBonus = 0; // Future: query if user has any previous correct submission

        // Achievements
        const achievements = this.determineAchievements(
            puzzle,
            timeTakenSeconds,
            hintsUsed,
        );

        const totalScore = Math.max(0, baseScore + timeBonus + streakBonus - hintPenalty + firstSolveBonus);
        const totalExperience = Math.round(totalScore * 0.5) + achievements.length * 50;

        return {
            baseScore,
            timeBonus,
            streakBonus,
            hintPenalty: -hintPenalty,   // negative for display
            firstSolveBonus,
            totalScore,
            totalExperience,
            achievements,
        };
    }

    /**
     * Determine achievement badges earned based on performance.
     */
    private determineAchievements(
        puzzle: Puzzle,
        timeTakenSeconds: number,
        hintsUsed: number,
    ): string[] {
        const achievements: string[] = [];

        if (hintsUsed === 0) {
            achievements.push('independent_thinker');
        }

        if (puzzle.timeLimit && timeTakenSeconds < puzzle.timeLimit * 0.3) {
            achievements.push('speed_demon');
        }

        if (hintsUsed === 0 && puzzle.timeLimit && timeTakenSeconds < puzzle.timeLimit * 0.5) {
            achievements.push('perfect_solver');
        }

        const difficulty = puzzle.difficulty as string;
        if (difficulty === 'hard' || difficulty === 'expert') {
            achievements.push('challenge_accepted');
        }

        return achievements;
    }

    /**
     * Increment puzzle.attempts without a full transaction (used when aborting early).
     */
    private async incrementAttempts(puzzle: Puzzle): Promise<void> {
        await this.puzzleRepo.increment({ id: puzzle.id }, 'attempts', 1);
    }

    /**
     * Helper to build and save a PuzzleSolutionAttempt outside a transaction.
     * Used for early-exit paths (timeout, etc.) where no reward calculation is needed.
     */
    private async persistAttempt(data: {
        userId: string;
        puzzleId: string;
        nonce: string;
        answer: any;
        status: SolutionAttemptStatus;
        sessionStartedAt: Date;
        timeTakenSeconds: number;
        hintsUsed: number;
        scoreAwarded: number;
        rewardData: any;
        fraudFlags: any;
        ipAddress?: string;
        metadata: any;
    }): Promise<PuzzleSolutionAttempt> {
        const attempt = this.attemptRepo.create({
            ...data,
            answerHash: this.hashAnswer(data.answer),
        });
        return this.attemptRepo.save(attempt);
    }
}
