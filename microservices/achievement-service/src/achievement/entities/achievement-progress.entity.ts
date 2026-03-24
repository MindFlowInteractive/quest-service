import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Achievement } from './achievement.entity';

@Entity('achievement_progress')
@Unique(['userId', 'achievementId'])
export class AchievementProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  achievementId: string;

  @ManyToOne(() => Achievement, (achievement) => achievement.progresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  @Column({ type: 'int', default: 0 })
  currentValue: number;

  @Column({ type: 'timestamp', nullable: true })
  unlockedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastEvaluatedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
