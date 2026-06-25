import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Segment } from './segment.entity';
import { SegmentEventType } from '../interfaces/user-signal.interface';

@Entity('segment_events')
@Index('idx_segment_events_segment', ['segmentId'])
@Index('idx_segment_events_user', ['userId'])
export class SegmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  segmentId: string;

  @ManyToOne(() => Segment, (segment) => segment.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment;

  @Column({ type: 'varchar', length: 120 })
  userId: string;

  @Column({
    type: 'enum',
    enum: SegmentEventType,
  })
  type: SegmentEventType;

  @Column({ type: 'varchar', length: 240, nullable: true })
  reason: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
