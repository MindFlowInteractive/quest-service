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
import { Puzzle } from './puzzle.entity';

export enum PuzzleSubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  FEATURED = 'featured',
}

export enum ModerationAction {
  PENDING_REVIEW = 'pending_review',
  AUTO_APPROVED = 'auto_approved',
  MANUALLY_APPROVED = 'manually_approved',
  REJECTED_CONTENT = 'rejected_content',
  REJECTED_QUALITY = 'rejected_quality',
  REJECTED_DUPLICATE = 'rejected_duplicate',
  REJECTED_INAPPROPRIATE = 'rejected_inappropriate',
  REQUIRES_CHANGES = 'requires_changes',
}

@Entity('user_puzzle_submissions')
@Index(['userId', 'status'])
@Index(['status', 'submittedAt'])
@Index(['isPublic', 'status'])
export class UserPuzzleSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category: string;

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  @Index()
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';

  @Column({ type: 'int', default: 1 })
  difficultyRating: number;

  @Column({ type: 'int', default: 100 })
  basePoints: number;

  @Column({ type: 'int', default: 300 })
  timeLimit: number;

  @Column({ type: 'int', default: 3 })
  maxHints: number;

  @Column({ type: 'jsonb' })
  content: {
    type: 'multiple-choice' | 'fill-blank' | 'drag-drop' | 'code' | 'visual' | 'logic-grid';
    question?: string;
    options?: string[];
    correctAnswer?: any;
    explanation?: string;
    media?: {
      images?: string[];
      videos?: string[];
      audio?: string[];
    };
    interactive?: {
      components?: any[];
      rules?: any;
      initialState?: any;
    };
  };

  @Column({ type: 'jsonb', default: [] })
  hints: Array<{
    order: number;
    text: string;
    pointsPenalty: number;
    unlockAfter?: number;
  }>;

  @Column({ type: 'simple-array', default: [] })
  @Index()
  tags: string[];

  @Column({ type: 'enum', enum: PuzzleSubmissionStatus, default: PuzzleSubmissionStatus.DRAFT })
  @Index()
  status: PuzzleSubmissionStatus;

  @Column({ type: 'jsonb', default: {} })
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
    automatedChecks: {
      hasValidAnswer: boolean;
      hasExplanation: boolean;
      appropriateDifficulty: boolean;
      contentQuality: number;
      mediaValidation: boolean;
    };
  };

  @Column({ type: 'jsonb', default: {} })
  moderationData: {
    action: ModerationAction;
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNotes?: string;
    autoApprovalScore?: number;
    flaggedContent?: string[];
    qualityScore?: number;
    requiredChanges?: string[];
  };

  @Column({ type: 'boolean', default: false })
  @Index()
  isPublic: boolean;

  @Column({ type: 'boolean', default: false })
  @Index()
  allowComments: boolean;

  @Column({ type: 'boolean', default: true })
  allowRatings: boolean;

  @Column({ type: 'int', default: 0 })
  @Index()
  views: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  playCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Index()
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Index()
  averageCompletionRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Index()
  communityScore: number;

  @Column({ type: 'jsonb', default: {} })
  sharingSettings: {
    allowShare: boolean;
    shareableLink?: string;
    embeddable: boolean;
    downloadAllowed: boolean;
    attributionRequired: boolean;
  };

  @Column({ type: 'jsonb', default: {} })
  creatorNotes: {
    inspiration?: string;
    targetAudience?: string;
    estimatedTime?: string;
    learningObjectives?: string[];
    prerequisites?: string[];
  };

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  submittedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  publishedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  featuredAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastActivityAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  analytics: {
    completionRate?: number;
    averageTime?: number;
    skipRate?: number;
    hintUsage?: number;
    ratingDistribution?: Record<string, number>;
    dailyStats?: Array<{
      date: string;
      views: number;
      plays: number;
      completions: number;
      ratings: number;
    }>;
  };

  @Column({ type: 'jsonb', default: {} })
  rewardData: {
    totalEarnings?: number;
    monthlyEarnings?: Record<string, number>;
    achievements?: string[];
    creatorLevel?: number;
    featuredCount?: number;
    topCreatorRank?: number;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  // Relationships
  @OneToMany('PuzzleRating', 'submission')
  ratings: any[];

  @OneToMany('PuzzleComment', 'submission')
  comments: any[];

  @OneToMany('PuzzlePlay', 'submission')
  playSessions: any[];

  // If approved, link to the main puzzle table
  @ManyToOne(() => Puzzle, { nullable: true })
  @JoinColumn({ name: 'publishedPuzzleId' })
  publishedPuzzle?: Puzzle;
}
