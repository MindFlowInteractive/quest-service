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
import { WeeklyChallenge } from './weekly-challenge.entity';

@Entity('weekly_challenge_completions')
@Index(['userId', 'weeklyChallengeId'], { unique: true })
@Index(['userId', 'completedAt'])
export class WeeklyChallengeCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => WeeklyChallenge, (challenge) => challenge.completions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'weeklyChallengeId' })
  weeklyChallenge: WeeklyChallenge;

  @Column()
  @Index()
  weeklyChallengeId: string;

  @Column({ type: 'uuid', array: true, default: () => 'ARRAY[]::uuid[]' })
  completedPuzzleIds: string[]; // Puzzles completed from the weekly set

  @Column({ type: 'int', default: 0 })
  bonusXPAwarded: number; // Bonus XP granted for completing the week

  @Column({ type: 'boolean', default: false })
  allPuzzlesCompleted: boolean; // True if all weekly puzzles were completed

  @CreateDateColumn({ type: 'timestamp with time zone' })
  completedAt: Date;
}
