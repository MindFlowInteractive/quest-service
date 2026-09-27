import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EventParticipation } from './event-participation.entity';
import { EventMilestone } from './event-milestone.entity';

export enum CommunityEventStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CommunityEventPhase {
  PRE_EVENT = 'pre_event',
  MAIN = 'main',
  FINAL_PUSH = 'final_push',
  ENDED = 'ended',
}

@Entity('community_events')
@Index(['status'])
@Index(['startDate', 'endDate'])
export class CommunityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  theme?: string;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  startDate: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  endDate: Date;

  @Column({
    type: 'enum',
    enum: CommunityEventStatus,
    default: CommunityEventStatus.SCHEDULED,
  })
  @Index()
  status: CommunityEventStatus;

  @Column({
    type: 'enum',
    enum: CommunityEventPhase,
    default: CommunityEventPhase.PRE_EVENT,
  })
  currentPhase: CommunityEventPhase;

  @Column({ type: 'jsonb', nullable: true })
  phases?: Array<{
    phase: CommunityEventPhase;
    startDate: Date;
    endDate: Date;
    bonusMultiplier?: number;
    description?: string;
  }>;

  @Column({ type: 'int', default: 0 })
  participantCount: number;

  @Column({ type: 'int', nullable: true })
  maxParticipants?: number;

  @Column({ type: 'jsonb', default: {} })
  analytics: {
    totalActionsPerformed?: number;
    dailyParticipants?: Record<string, number>;
    engagementScore?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  exclusiveRewards?: Array<{
    rewardId: string;
    name: string;
    type: string;
    minScore?: number;
    rank?: number;
    description?: string;
  }>;

  @Column({ type: 'boolean', default: false })
  rewardsDistributed: boolean;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => EventParticipation, (p) => p.event, { cascade: true })
  participations: EventParticipation[];

  @OneToMany(() => EventMilestone, (m) => m.event, { cascade: true })
  milestones: EventMilestone[];
}
