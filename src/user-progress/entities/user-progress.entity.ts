import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserAchievement } from './user-achievement.entity';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 1 })
  level: number;


  @Column({ default: 0 })
  puzzlesCompleted: number;

  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Column({ type: 'simple-array', default: '' })
  solvedPuzzles: string[];

  @Column({ default: 0 })
  streakDays: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPuzzleCompletedAt: Date;

  @Column({ default: false })
  achievementFirstWin: boolean;

  @Column({ default: false })
  achievementStreakMaster: boolean;

  // Quest chain statistics
  @Column({ type: 'jsonb', default: '{}' })
  questChainStats: {
    totalChainsCompleted: number;
    currentChains: string[];
    bestCompletionTimes: { [chainId: string]: number };
    totalChainScore: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserAchievement, (ach) => ach.progress)
achievements: UserAchievement[];

}
