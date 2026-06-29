import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FLAGGED = 'flagged',
  REMOVED = 'removed',
}

export enum VoteType {
  HELPFUL = 'helpful',
  NOT_HELPFUL = 'not_helpful',
}

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  targetId: string;

  @Column()
  targetType: string;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  score: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageScore: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  targetId: string;

  @Column()
  targetType: string;

  @Column('text')
  content: string;

  @Column({ type: 'int', default: 0 })
  helpfulVotes: number;

  @Column({ type: 'int', default: 0 })
  notHelpfulVotes: number;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ default: false })
  isFlagged: boolean;

  @Column({ nullable: true })
  moderationNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('review_votes')
export class ReviewVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  reviewId: string;

  @Column({
    type: 'enum',
    enum: VoteType,
  })
  voteType: VoteType;

  @CreateDateColumn()
  createdAt: Date;
}