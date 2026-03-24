import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AchievementHistoryType } from '../achievement.types';
import { Achievement } from './achievement.entity';

@Entity('achievement_history')
export class AchievementHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  achievementId: string;

  @ManyToOne(() => Achievement, (achievement) => achievement.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  @Column({ type: 'enum', enum: AchievementHistoryType })
  type: AchievementHistoryType;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
