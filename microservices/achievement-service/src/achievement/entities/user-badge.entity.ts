import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Badge } from './badge.entity';
import { Achievement } from './achievement.entity';

@Entity('user_badges')
@Unique(['userId', 'badgeId'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  badgeId: string;

  @ManyToOne(() => Badge, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;

  @Column()
  achievementId: string;

  @ManyToOne(() => Achievement, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  @CreateDateColumn()
  awardedAt: Date;
}
