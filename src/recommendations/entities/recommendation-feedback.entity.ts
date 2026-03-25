import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Entity('recommendation_feedback')
@Index(['userId', 'puzzleId'])
@Index(['userId', 'createdAt'])
@Index(['feedbackType', 'createdAt'])
export class RecommendationFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  feedbackType: 'helpful' | 'not_helpful' | 'already_played';

  @Column({ type: 'text', nullable: true })
  comment: string; // optional user comment

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    recommendationId?: string;
    algorithm?: string;
    score?: number;
    source?: string; // how the recommendation was presented
    sessionId?: string;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;
}