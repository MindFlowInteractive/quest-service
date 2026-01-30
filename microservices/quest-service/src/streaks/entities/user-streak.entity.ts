import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn, Index } from 'typeorm';

export enum StreakType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

@Entity('user_streaks')
@Index(['userId', 'streakType'], { unique: true })
export class UserStreak {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: StreakType, default: StreakType.DAILY })
  streakType: StreakType;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  maxStreak: number;

  @Column({ type: 'timestamp' })
  lastActivityAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
