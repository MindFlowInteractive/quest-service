import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Achievement } from './achievement.entity';

@Entity({ name: 'achievement_progress' })
@Unique(['userId', 'achievement'])
export class AchievementProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Achievement, { eager: true })
  achievement: Achievement;

  @Column({ type: 'integer', default: 0 })
  currentValue: number;

  @Column({ default: false })
  isUnlocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  unlockedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastUpdatedAt: Date;
}
