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
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { DailyChallengeCompletion } from './daily-challenge-completion.entity';

@Entity('daily_challenges')
@Index(['challengeDate'], { unique: true })
@Index(['isActive'])
export class DailyChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;

  @Column()
  @Index()
  puzzleId: string;

  @Column({ type: 'date' })
  @Index()
  challengeDate: Date; // A fixed date (UTC midnight)

  @Column({ type: 'float', default: 1.0 })
  difficultyModifier: number;

  @Column({ type: 'int', default: 100 })
  baseRewardPoints: number;

  @Column({ type: 'int', default: 50 })
  bonusXP: number; // Bonus XP awarded for completing the daily challenge

  @Column({ type: 'int', default: 0 })
  completionCount: number; // Number of users who completed this daily challenge

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(
    () => DailyChallengeCompletion,
    (completion) => completion.dailyChallenge,
  )
  completions: DailyChallengeCompletion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
