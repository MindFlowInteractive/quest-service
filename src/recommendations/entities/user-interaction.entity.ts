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

@Entity('user_interactions')
@Index(['userId', 'puzzleId'])
@Index(['userId', 'interactionType', 'createdAt'])
export class UserInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  interactionType: 'view' | 'click' | 'start' | 'complete' | 'abandon' | 'rate' | 'share';

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  value: number; // rating value, completion time, etc.

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    completionTime?: number;
    hintsUsed?: number;
    attempts?: number;
    score?: number;
    source?: string; // where the interaction came from
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