import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { HintUsage } from './hint-usage.entity';

@Entity('hints')
@Index(['puzzleId', 'order'])
@Index(['type', 'difficulty'])
export class Hint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'int' })
  order: number; // Progressive hint order (1, 2, 3, etc.)

  @Column({ type: 'varchar', length: 50 })
  type: 'general' | 'contextual' | 'strategic' | 'specific' | 'tutorial';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  contextualData?: {
    triggerConditions?: string[];
    playerState?: any;
    puzzleState?: any;
  };

  @Column({ type: 'int', default: 0 })
  cost: number; // Points or currency cost

  @Column({ type: 'int', default: 0 })
  pointsPenalty: number; // Points deducted from final score

  @Column({ type: 'int', nullable: true })
  unlockAfterSeconds?: number; // Time-based unlock

  @Column({ type: 'int', nullable: true })
  unlockAfterAttempts?: number; // Attempt-based unlock

  @Column({ type: 'jsonb', default: {} })
  skillLevelTarget: {
    minLevel?: number;
    maxLevel?: number;
    preferredLevel?: number;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  effectiveness: number; // 0-1 scale, calculated from usage data

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'int', default: 0 })
  successCount: number; // Times hint led to puzzle completion

  @Column({ type: 'jsonb', default: {} })
  analytics: {
    averageTimeToCompletion?: number;
    completionRate?: number;
    userSatisfaction?: number;
    abuseAttempts?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('Puzzle', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: any;

  @OneToMany(() => HintUsage, (usage) => usage.hint)
  usages: HintUsage[];
}
