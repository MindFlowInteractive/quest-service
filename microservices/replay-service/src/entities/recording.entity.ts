import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Replay } from './replay.entity';

export enum RecordingStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

export enum CompressionType {
  NONE = 'none',
  GZIP = 'gzip',
  BROTLI = 'brotli',
}

@Entity('recordings')
@Index(['replayId'])
@Index(['playerId'])
@Index(['status'])
@Index(['createdAt'])
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  replayId: string;

  @ManyToOne(() => Replay, {
    onDelete: 'CASCADE',
  })
  replay: Replay;

  @Column({ type: 'integer' })
  playerId: number;

  @Column({ type: 'integer' })
  puzzleId: number;

  @Column({ type: 'enum', enum: RecordingStatus, default: RecordingStatus.ACTIVE })
  status: RecordingStatus;

  @Column({ type: 'enum', enum: CompressionType, default: CompressionType.GZIP })
  compressionType: CompressionType;

  @Column({ type: 'bigint', default: 0 })
  originalSize: number; // Size before compression

  @Column({ type: 'bigint', default: 0 })
  compressedSize: number; // Size after compression

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  compressionRatio: number; // Percentage

  @Column({ type: 'varchar', nullable: true })
  storageUrl?: string; // URL to stored file (S3, etc.)

  @Column({ type: 'varchar', nullable: true })
  storageKey?: string; // Storage system key/path

  @Column({ type: 'bigint', nullable: true })
  duration?: number; // Total duration in ms

  @Column({ type: 'integer', default: 0 })
  actionCount: number; // Total actions recorded

  @Column('jsonb', { default: {} })
  metadata: {
    puzzleName?: string;
    difficulty?: string;
    completed?: boolean;
    timeToComplete?: number;
    hintsUsed?: number;
    undoCount?: number;
    redoCount?: number;
    startedAt?: Date;
    endedAt?: Date;
  };

  @Column({ nullable: true })
  failureReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
