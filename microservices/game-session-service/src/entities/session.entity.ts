import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
  TIMEOUT = 'TIMEOUT',
}

@Entity('sessions')
@Index(['userId', 'status'])
@Index(['sessionId'], { unique: true })
@Index(['lastActiveAt'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  sessionId: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  puzzleId?: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @Column({ type: 'timestamp with time zone' })
  startTime: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endTime?: Date;

  @Column({ type: 'timestamp with time zone' })
  lastActiveAt: Date;

  @Column({ type: 'int', default: 0 })
  duration: number; // in seconds

  @Column({ type: 'int', default: 0 })
  totalMoves: number;

  @Column({ type: 'int', default: 0 })
  totalScore: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    platform?: string;
    deviceInfo?: string;
    browserInfo?: string;
    gameMode?: string;
    difficulty?: string;
    category?: string;
  };

  @Column({ type: 'int', nullable: true })
  timeoutAfter?: number; // seconds until timeout

  @Column({ type: 'timestamp with time zone', nullable: true })
  timeoutAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
