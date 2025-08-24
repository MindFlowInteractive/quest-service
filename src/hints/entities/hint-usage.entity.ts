import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('hint_usages')
@Index(['userId', 'puzzleId'])
@Index(['hintId', 'createdAt'])
export class HintUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  hintId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'int' })
  attemptNumber: number; // Which attempt this hint was used on

  @Column({ type: 'int' })
  timeSpent: number; // Seconds spent before using hint

  @Column({ type: 'boolean', default: false })
  ledToCompletion: boolean; // Whether hint helped complete puzzle

  @Column({ type: 'int', nullable: true })
  timeToCompletion?: number; // Time from hint to completion

  @Column({ type: 'int', default: 1 })
  satisfactionRating: number; // 1-5 scale, user feedback

  @Column({ type: 'jsonb', nullable: true })
  playerState: {
    skillLevel?: number;
    previousHintsUsed?: number;
    currentAttempts?: number;
    timeElapsed?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  puzzleState: {
    progress?: any;
    currentStep?: string;
    errors?: string[];
  };

  @Column({ type: 'boolean', default: false })
  isAbuseAttempt: boolean; // Flag for potential abuse

  @Column({ type: 'text', nullable: true })
  abuseReason?: string; // Reason for abuse flag

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => 'Hint', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hintId' })
  hint: any;

  @ManyToOne(() => 'Puzzle', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: any;
}
