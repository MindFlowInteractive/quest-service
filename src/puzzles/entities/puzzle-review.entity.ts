import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Puzzle } from './puzzle.entity';
import { ReviewVote } from './review-vote.entity';

@Entity('puzzle_reviews')
@Index(['userId', 'puzzleId'], { unique: true, where: '"deletedAt" IS NULL' })
export class PuzzleReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'text' })
  reviewText: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'flagged'], default: 'pending' })
  @Index()
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';

  @Column({ type: 'int', default: 0 })
  helpfulVotes: number;

  @Column({ type: 'int', default: 0 })
  unhelpfulVotes: number;

  @Column({ type: 'boolean', default: false })
  isFlagged: boolean;

  @Column({ type: 'text', nullable: true })
  flagReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;

  @OneToMany(() => ReviewVote, (vote) => vote.review)
  votes: ReviewVote[];
}
