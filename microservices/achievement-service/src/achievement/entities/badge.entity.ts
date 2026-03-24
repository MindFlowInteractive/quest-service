import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Achievement } from './achievement.entity';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  achievementId: string;

  @OneToOne(() => Achievement, (achievement) => achievement.badge, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  iconUrl?: string;

  @CreateDateColumn()
  createdAt: Date;
}
