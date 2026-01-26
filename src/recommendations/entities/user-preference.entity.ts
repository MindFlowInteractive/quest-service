import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_preferences')
@Index(['userId'])
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category: string; // puzzle category

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.5 })
  preferenceScore: number; // 0.0 to 1.0

  @Column({ type: 'varchar', length: 20 })
  @Index()
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.5 })
  difficultyScore: number; // 0.0 to 1.0

  @Column({ type: 'jsonb', default: {} })
  tagPreferences: Record<string, number>; // tag -> preference score

  @Column({ type: 'int', default: 0 })
  interactionCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  averageCompletionTime: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  successRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}