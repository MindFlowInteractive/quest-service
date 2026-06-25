import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Segment } from './segment.entity';
import { MembershipSource } from '../interfaces/user-signal.interface';

@Entity('memberships')
@Index('idx_membership_segment_user', ['segmentId', 'userId'], { unique: true })
@Index('idx_membership_user', ['userId'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  segmentId: string;

  @ManyToOne(() => Segment, (segment) => segment.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment;

  @Column({ type: 'varchar', length: 120 })
  userId: string;

  @Column({
    type: 'enum',
    enum: MembershipSource,
    default: MembershipSource.EVALUATION,
  })
  source: MembershipSource;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
