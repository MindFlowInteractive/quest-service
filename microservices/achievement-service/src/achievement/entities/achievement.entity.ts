import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AchievementConditionType, AchievementRarity } from '../achievement.types';
import { AchievementProgress } from './achievement-progress.entity';
import { Badge } from './badge.entity';
import { AchievementHistory } from './achievement-history.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  metricKey: string;

  @Column({ type: 'int' })
  targetValue: number;

  @Column({
    type: 'enum',
    enum: AchievementConditionType,
    default: AchievementConditionType.THRESHOLD,
  })
  conditionType: AchievementConditionType;

  @Column({
    type: 'enum',
    enum: AchievementRarity,
    default: AchievementRarity.COMMON,
  })
  rarity: AchievementRarity;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Badge, (badge) => badge.achievement)
  badge?: Badge;

  @OneToMany(() => AchievementProgress, (progress) => progress.achievement)
  progresses: AchievementProgress[];

  @OneToMany(() => AchievementHistory, (history) => history.achievement)
  history: AchievementHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
