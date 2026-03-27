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
import { DailyChallenge } from './daily-challenge.entity';

@Entity('daily_challenge_completions')
@Index(['userId', 'dailyChallengeId'], { unique: true })
export class DailyChallengeCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => DailyChallenge, (challenge) => challenge.completions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dailyChallengeId' })
  dailyChallenge: DailyChallenge;

  @Column()
  @Index()
  dailyChallengeId: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  timeSpent: number; // in seconds

  @Column({ type: 'int', default: 0 })
  streakBonusAwarded: number;

  @Column({ type: 'int', default: 0 })
  bonusXPAwarded: number; // Bonus XP awarded from the daily challenge

  @Column({ type: 'boolean', default: false })
  bonusXPClaimed: boolean; // Whether the bonus XP has been claimed (prevents double claims)

  @CreateDateColumn({ type: 'timestamp with time zone' })
  completedAt: Date;
}
