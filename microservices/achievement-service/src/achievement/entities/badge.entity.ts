import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Achievement, AchievementRarity } from './achievement.entity';

@Entity({ name: 'badges' })
@Unique(['userId', 'achievement'])
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Achievement, { eager: true })
  achievement: Achievement;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AchievementRarity })
  rarity: AchievementRarity;

  @Column({ nullable: true })
  iconUrl?: string;

  @CreateDateColumn()
  awardedAt: Date;
}
