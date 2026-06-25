import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rule } from './rule.entity';
import { Membership } from './membership.entity';
import { SegmentEvent } from './segment-event.entity';
import {
  SegmentStatus,
  SegmentationType,
} from '../interfaces/user-signal.interface';

@Entity('segments')
@Index('idx_segments_slug', ['slug'], { unique: true })
@Index('idx_segments_status', ['status'])
@Index('idx_segments_type', ['type'])
export class Segment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 180 })
  slug: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: SegmentationType,
    default: SegmentationType.RULE_BASED,
  })
  type: SegmentationType;

  @Column({
    type: 'enum',
    enum: SegmentStatus,
    default: SegmentStatus.DRAFT,
  })
  status: SegmentStatus;

  /**
   * Cached count of members for fast size lookups.
   */
  @Column({ type: 'int', default: 0 })
  cachedSize: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastEvaluatedAt: Date | null;

  /**
   * Evaluation cadence in seconds; 0 means manual only.
   */
  @Column({ type: 'int', default: 0 })
  evaluationIntervalSeconds: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @OneToMany(() => Rule, (rule) => rule.segment, { cascade: true })
  rules: Rule[];

  @OneToMany(() => Membership, (membership) => membership.segment, {
    cascade: true,
  })
  memberships: Membership[];

  @OneToMany(() => SegmentEvent, (event) => event.segment, { cascade: true })
  events: SegmentEvent[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
