import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserProgress } from './user-progress.entity';

@Entity()
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  achievementCode: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  unlockedAt: Date;

  @ManyToOne(() => UserProgress, (progress) => progress.achievements)
  progress: UserProgress;
}
