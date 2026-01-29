/**
 * Community Review Entity
 * Reviews and feedback on community submissions
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CommunitySubmission } from './community-submission.entity';

@Entity('community_reviews')
@Index(['submissionId', 'createdAt'])
@Index(['reviewedBy'])
export class CommunityReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  submissionId: string;

  @Column({ type: 'uuid' })
  reviewedBy: string;

  @Column({
    type: 'enum',
    enum: ['COMMUNITY_MEMBER', 'MODERATOR', 'ADMIN', 'GAME_DESIGNER'],
    default: 'COMMUNITY_MEMBER',
  })
  role: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'REVIEWING', 'APPROVED', 'REQUESTED_CHANGES', 'REJECTED'],
    default: 'PENDING',
  })
  status: string;

  @Column({ type: 'integer' })
  rating: number; // 1-5

  @Column({ type: 'text' })
  feedback: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  suggestions: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  checklist: any[]; // ReviewChecklistItem[]

  @Column({ type: 'text', nullable: true })
  requestedChanges?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CommunitySubmission, (submission) => submission.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submissionId' })
  submission?: CommunitySubmission;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer?: User;
}
