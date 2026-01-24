@Entity('puzzle_attempts')
@Index(['puzzleId', 'timestamp'])
@Index(['playerId', 'timestamp'])
export class PuzzleAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  puzzleId: string;

  @Column()
  @Index()
  playerId: string;

  @Column()
  sessionId: string;

  @Column()
  difficulty: string; // easy, medium, hard, expert

  @Column({ type: 'boolean' })
  success: boolean;

  @Column({ type: 'int' })
  timeTaken: number; // in seconds

  @Column({ type: 'int' })
  movesCount: number;

  @Column({ type: 'int', default: 0 })
  hintsUsed: number;

  @Column({ type: 'int', nullable: true })
  score: number;

  @Column({ type: 'boolean', default: false })
  abandoned: boolean;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  timestamp: Date;
}