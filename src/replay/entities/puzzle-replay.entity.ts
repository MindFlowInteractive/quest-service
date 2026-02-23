import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

export enum ReplaySharePermission {
  PRIVATE = 'private',
  SHARED_LINK = 'shared_link',
  PUBLIC = 'public',
}

/**
 * Main replay entity storing puzzle solving sessions for later review
 * Replays are immutable after completion
 */
@Entity('puzzle_replays')
@Index(['userId', 'puzzleId'])
@Index(['userId', 'createdAt'])
@Index(['puzzleId', 'isCompleted'])
@Index(['shareCode'])
export class PuzzleReplay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // References
  @Column('uuid')
  @Index()
  userId: string;

  @Column('uuid')
  @Index()
  puzzleId: string;

  @Column('uuid', { nullable: true })
  gameSessionId: string;

  // Basic info
  @Column({ type: 'varchar', length: 200 })
  puzzleTitle: string;

  @Column({ type: 'varchar', length: 50 })
  puzzleCategory: string;

  @Column({ type: 'varchar', length: 20 })
  puzzleDifficulty: 'easy' | 'medium' | 'hard' | 'expert';

  // Completion status
  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'boolean', default: false })
  isSolved: boolean;

  // Timing information
  @Column({ type: 'int' })
  totalDuration: number; // Total duration in milliseconds

  @Column({ type: 'int', default: 0 })
  activeTime: number; // Time spent solving (excluding pauses) in milliseconds

  @Column({ type: 'int', default: 0 })
  pausedTime: number; // Total pause duration in milliseconds

  // Performance metrics
  @Column({ type: 'int', default: 0 })
  movesCount: number; // Total actions taken

  @Column({ type: 'int', default: 0 })
  hintsUsed: number; // Number of hints used

  @Column({ type: 'int', default: 0 })
  undosCount: number; // Number of undo actions

  @Column({ type: 'int', default: 0 })
  stateChanges: number; // Number of game state changes

  // Performance score
  @Column({ type: 'int', nullable: true })
  scoreEarned: number; // Points earned from this completion

  @Column({ type: 'int', nullable: true })
  maxScorePossible: number; // Maximum possible score

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  efficiency: number; // Solve efficiency percentage (0-100)

  // Initial state snapshot
  @Column('jsonb')
  initialState: Record<string, any>;

  // Final state snapshot
  @Column('jsonb', { nullable: true })
  finalState: Record<string, any>;

  // User metadata
  @Column('jsonb', { default: {} })
  userMetadata: {
    playerLevel?: number;
    completedPuzzlesCount?: number;
    attemptNumber?: number;
  };

  // Session metadata
  @Column('jsonb', { default: {} })
  sessionMetadata: {
    platform?: string;
    device?: string;
    browser?: string;
  };

  // Sharing configuration
  @Column({
    type: 'varchar',
    enum: ReplaySharePermission,
    default: ReplaySharePermission.PRIVATE,
  })
  permission: ReplaySharePermission;

  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  shareCode: string; // Unique code for sharing replays

  @Column({ type: 'timestamp', nullable: true })
  shareExpiredAt: Date; // When the share expires

  @Column({ type: 'int', default: 0 })
  viewCount: number; // Number of times replay was viewed

  // Storage optimization
  @Column({ type: 'boolean', default: false })
  isCompressed: boolean; // Whether replay is compressed

  @Column({ type: 'int', default: 0 })
  storageSize: number; // Size in bytes

  @Column({ type: 'varchar', length: 50, default: 'active' })
  archiveStatus: 'active' | 'archived' | 'deleted'; // Archive status for cleanup

  // Relations
  @OneToMany('ReplayAction', 'replay', {
    cascade: true,
    eager: false,
  })
  actions: any[];

  // Timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastViewedAt: Date;
}
