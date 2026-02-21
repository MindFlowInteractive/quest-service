import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

/**
 * Status of a puzzle solution submission attempt
 */
export enum SolutionAttemptStatus {
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  TIMEOUT = 'timeout',
  FRAUD_DETECTED = 'fraud_detected',
  RATE_LIMITED = 'rate_limited',
}

/**
 * Tracks every puzzle solution submission attempt.
 * Answers are stored as SHA-256 hashes — plaintext answers are never persisted.
 * The `nonce` column has a unique constraint to prevent replay attacks.
 */
@Entity('puzzle_solution_attempts')
@Unique(['nonce'])                     // Anti-replay: nonce must be globally unique
@Index(['userId', 'puzzleId'])
@Index(['userId', 'createdAt'])
@Index(['puzzleId', 'status'])
export class PuzzleSolutionAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ──────────────── Identifiers ────────────────

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  // ──────────────── Anti-Replay ────────────────

  /**
   * Client-generated UUID v4 that must be unique per submission.
   * Stored to detect replay attacks (re-submitting same request).
   */
  @Column({ type: 'varchar', length: 36 })
  @Index()
  nonce: string;

  // ──────────────── Verification ────────────────

  /**
   * SHA-256 hash of the normalised submitted answer.
   * Never store the plaintext answer.
   */
  @Column({ type: 'varchar', length: 64 })
  answerHash: string;

  @Column({
    type: 'enum',
    enum: SolutionAttemptStatus,
    default: SolutionAttemptStatus.INCORRECT,
  })
  @Index()
  status: SolutionAttemptStatus;

  // ──────────────── Timing ────────────────

  /**
   * ISO timestamp sent by the client indicating when they received
   * (started) the puzzle. Used for time-limit and fraud validation.
   */
  @Column({ type: 'timestamp with time zone' })
  sessionStartedAt: Date;

  /**
   * Elapsed seconds between sessionStartedAt and submission time.
   * Computed server-side — not trusted from the client.
   */
  @Column({ type: 'int', default: 0 })
  timeTakenSeconds: number;

  // ──────────────── Performance ────────────────

  @Column({ type: 'int', default: 0 })
  hintsUsed: number;

  // ──────────────── Rewards ────────────────

  @Column({ type: 'int', default: 0 })
  scoreAwarded: number;

  /**
   * Detailed reward breakdown: base points, bonuses, penalties, achievements.
   */
  @Column({ type: 'jsonb', default: {} })
  rewardData: {
    baseScore?: number;
    timeBonus?: number;
    streakBonus?: number;
    hintPenalty?: number;
    firstSolveBonus?: number;
    achievements?: string[];
    totalExperience?: number;
  };

  // ──────────────── Fraud / Anti-Cheat ────────────────

  /**
   * Fraud/anti-cheat flags recorded during processing.
   * Submission may still be stored when fraud is detected for audit purposes.
   */
  @Column({ type: 'jsonb', default: {} })
  fraudFlags: {
    tooFast?: boolean;
    minExpectedSeconds?: number;
    actualSeconds?: number;
    violationTypes?: string[];
    riskScore?: number;
  };

  // ──────────────── Request Metadata ────────────────

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  /**
   * Extensible metadata (user-agent, device fingerprint, geo, etc.)
   */
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
