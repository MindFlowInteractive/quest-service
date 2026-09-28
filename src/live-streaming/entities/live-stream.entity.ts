import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum LiveStreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum StreamQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  SOURCE = 'source',
}

/**
 * A live puzzle attempt a broadcaster streams to spectators.
 *
 * `viewerCount` is a cached copy of the active roster for cheap reads; the
 * authoritative count is the active `StreamViewer` rows. `peakViewerCount` is
 * monotonic so analytics can report the high-water mark even after everyone
 * leaves.
 */
@Entity('live_streams')
@Index(['hostId'])
@Index(['status'])
export class LiveStream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  hostId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: LiveStreamStatus.SCHEDULED,
  })
  status: LiveStreamStatus;

  @Column({
    type: 'varchar',
    length: 10,
    default: StreamQuality.MEDIUM,
  })
  currentQuality: StreamQuality;

  @Column({ type: 'int', default: 0 })
  viewerCount: number;

  @Column({ type: 'int', default: 0 })
  peakViewerCount: number;

  @Column({ type: 'boolean', default: false })
  recordingEnabled: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  recordingUrl?: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
