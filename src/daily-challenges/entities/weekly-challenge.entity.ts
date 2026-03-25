import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { WeeklyChallengeCompletion } from './weekly-challenge-completion.entity';

@Entity('weekly_challenges')
@Index(['weekStart'], { unique: true })
@Index(['isActive'])
export class WeeklyChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  @Index()
  weekStart: Date; // Monday of the week (UTC date)

  @ManyToMany(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinTable({ name: 'weekly_challenge_puzzles' })
  puzzles: Puzzle[];

  @Column('uuid', { array: true, default: () => 'ARRAY[]::uuid[]' })
  @Index()
  puzzleIds: string[]; // Denormalized for query efficiency

  @Column({ type: 'int', default: 250 })
  bonusXP: number; // Bonus XP for completing all puzzles

  @Column({ type: 'int', default: 0 })
  completionCount: number; // Number of users who completed all weekly puzzles

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(
    () => WeeklyChallengeCompletion,
    (completion) => completion.weeklyChallenge,
  )
  completions: WeeklyChallengeCompletion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
