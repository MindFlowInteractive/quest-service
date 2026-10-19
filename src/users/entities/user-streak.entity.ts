import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_streaks')
export class UserStreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.streak, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ nullable: true })
  lastPuzzleCompletedAt: Date;

  @Column({ nullable: true })
  streakStartDate: Date; // When the current streak started

  @Column({ default: 0 })
  longestStreak: number; // Best streak ever achieved

  @Column({ nullable: true })
  streakRecoveryGracePeriodEnd: Date; // For streak recovery mechanics

  @Column({ default: 0 })
  gracePeriodsGranted: number; // Number of grace periods handed out

  @Column({ default: 0 })
  gracePeriodsUsed: number; // Number of grace periods consumed to save a streak
}
