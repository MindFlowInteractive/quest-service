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
import { SeasonalEvent } from './seasonal-event.entity';

@Entity('event_puzzles')
@Index(['eventId', 'category'])
@Index(['eventId', 'isActive'])
export class EventPuzzle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  eventId: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  category: string; // e.g., 'logic', 'math', 'pattern', 'word', 'riddle'

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';

  @Column({ type: 'jsonb' })
  content: {
    type: 'multiple-choice' | 'fill-blank' | 'true-false' | 'code' | 'visual';
    options?: string[];
    correctAnswer: any;
    explanation?: string;
    media?: {
      images?: string[];
      videos?: string[];
    };
  };

  @Column({ type: 'int', default: 100 })
  rewardPoints: number;

  @Column({ type: 'int', default: 300 })
  timeLimit: number; // in seconds

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  completionCount: number;

  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @Column({ type: 'simple-array', default: [] })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => SeasonalEvent, (event) => event.puzzles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: SeasonalEvent;
}
