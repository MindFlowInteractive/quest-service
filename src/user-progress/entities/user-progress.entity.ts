import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  puzzlesCompleted: number;

  @Column({ default: 0 })
  streakDays: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPuzzleCompletedAt: Date;

  @Column({ default: false })
  achievementFirstWin: boolean;

  @Column({ default: false })
  achievementStreakMaster: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserAchievement, (ach) => ach.progress)
achievements: UserAchievement[];

}
