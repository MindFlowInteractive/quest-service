import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Session } from './session.entity';

export interface ReplayMove {
  moveId: string;
  moveType: string;
  moveData: any;
  timestamp: Date;
  relativeTime: number; // milliseconds from start
  moveNumber: number;
}

export interface ReplaySnapshot {
  snapshotId: string;
  step: number;
  state: any;
  timestamp: Date;
  relativeTime: number;
}

@Entity('replays')
@Index(['sessionId'], { unique: true })
@Index(['userId', 'createdAt'])
export class Replay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  sessionId: string;

  @ManyToOne(() => Session, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId', referencedColumnName: 'sessionId' })
  session: Session;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  puzzleId?: string;

  @Column({ type: 'jsonb' })
  initialState: Record<string, any>;

  @Column({ type: 'jsonb', default: [] })
  moves: ReplayMove[];

  @Column({ type: 'jsonb', default: [] })
  snapshots: ReplaySnapshot[];

  @Column({ type: 'int', default: 0 })
  totalDuration: number; // milliseconds

  @Column({ type: 'int', default: 0 })
  totalMoves: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    defaultSpeed?: number; // playback speed multiplier
    lastViewedPosition?: number; // last position viewed in replay
    completed?: boolean;
    tags?: string[];
    description?: string;
    isPublic?: boolean;
    shareCode?: string;
  };

  @Column({ type: 'boolean', default: false })
  isRecording: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  recordingStartedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  recordingEndedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
