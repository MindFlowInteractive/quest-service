import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserPuzzleSubmission } from './user-puzzle-submission.entity';

export enum PuzzleCommentStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
  FLAGGED = 'flagged',
}

@Entity('puzzle_comments')
@Index(['submissionId', 'status'])
@Index(['userId', 'createdAt'])
@Index(['parentId'])
export class PuzzleComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  submissionId: string;

  @ManyToOne(() => UserPuzzleSubmission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission: UserPuzzleSubmission;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  parentId?: string;

  @ManyToOne(() => PuzzleComment, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: PuzzleComment;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: PuzzleCommentStatus, default: PuzzleCommentStatus.ACTIVE })
  @Index()
  status: PuzzleCommentStatus;

  @Column({ type: 'jsonb', default: {} })
  moderationFlags: {
    reportedBy?: string[];
    reportReasons?: string[];
    autoFlagged?: boolean;
    flagScore?: number;
    reviewedBy?: string;
    reviewedAt?: Date;
  };

  @Column({ type: 'int', default: 0 })
  @Index()
  upvotes: number;

  @Column({ type: 'int', default: 0 })
  downvotes: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  replyCount: number;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'boolean', default: false })
  isFromCreator: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    editedAt?: Date;
    editCount?: number;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => PuzzleComment, (comment: PuzzleComment) => comment.parent)
  replies: PuzzleComment[];
}
