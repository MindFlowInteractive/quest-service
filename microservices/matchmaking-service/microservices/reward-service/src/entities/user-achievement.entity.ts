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

@Entity('user_achievements')
@Index(['userId', 'unlockedAt'])
@Index(['achievementId', 'userId'], { unique: true })
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  achievementId: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  isUnlocked: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  unlockedAt?: Date;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    unlockDetails?: any;
    progressSteps?: any[];
    relatedActivities?: string[];
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('Achievement', 'userAchievements')
  @JoinColumn({ name: 'achievementId' })
  achievement: any;
}