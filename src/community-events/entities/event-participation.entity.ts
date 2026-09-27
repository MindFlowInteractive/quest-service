import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { CommunityEvent } from './community-event.entity';

@Entity('event_participations')
@Index(['userId', 'eventId'])
@Index(['eventId', 'score'])
@Unique(['userId', 'eventId'])
export class EventParticipation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  eventId: string;

  @Column({ type: 'int', default: 0 })
  @Index()
  score: number;

  @Column({ type: 'int', default: 0 })
  actionsPerformed: number;

  @Column({ type: 'jsonb', default: [] })
  milestonesReached: Array<{
    milestoneId: string;
    milestoneName: string;
    reachedAt: Date;
  }>;

  @Column({ type: 'jsonb', default: [] })
  rewardsEarned: Array<{
    rewardId: string;
    rewardName: string;
    rewardType: string;
    earnedAt: Date;
  }>;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  verificationData?: Record<string, any>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  joinedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastActivityAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => CommunityEvent, (event) => event.participations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: CommunityEvent;
}
