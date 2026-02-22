import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PuzzleReview } from './puzzle-review.entity';

@Entity('review_votes')
@Unique(['userId', 'reviewId'])
export class ReviewVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  reviewId: string;

  @Column({ type: 'enum', enum: ['helpful', 'unhelpful'] })
  voteType: 'helpful' | 'unhelpful';

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => PuzzleReview, (review) => review.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewId' })
  review: PuzzleReview;
}
