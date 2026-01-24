/**
 * Community Submission Entity
 * Represents community-contributed puzzles submitted for review
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PuzzleEditor } from './puzzle-editor.entity';
import { CommunityReview } from './community-review.entity';

@Entity('community_submissions')
@Index(['status', 'createdAt'])
@Index(['submittedBy'])
@Index(['puzzleEditorId'])
export class CommunitySubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  puzzleEditorId: string;

  @Column({ type: 'uuid' })
  submittedBy: string;

  @Column({
    type: 'enum',
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'FEATURED', 'ARCHIVED'],
    default: 'DRAFT',
  })
  status: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: {
    playtestSessions: number;
    avgPlaytestRating: number;
    commonIssues: string[];
    estimatedDifficulty: string;
    recommendedAgeGroup?: string;
    completionRate?: number;
    lastUpdated: Date;
    viewCount: number;
    downloadCount: number;
  };

  @Column({ type: 'integer', default: 0 })
  upvotes: number;

  @Column({ type: 'integer', default: 0 })
  downvotes: number;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PuzzleEditor, (editor) => editor.submissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'puzzleEditorId' })
  puzzleEditor?: PuzzleEditor;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submittedBy' })
  submitter?: User;

  @ManyToOne(() => User, { eager: false, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver?: User;

  @OneToMany(() => CommunityReview, (review) => review.submission, {
    cascade: true,
    eager: false,
  })
  reviews?: CommunityReview[];
}
