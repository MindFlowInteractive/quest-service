import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('hint_templates')
@Index(['puzzleType', 'difficulty'])
@Index(['category', 'isActive'])
export class HintTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  puzzleType: 'multiple-choice' | 'fill-blank' | 'drag-drop' | 'code' | 'visual' | 'logic-grid';

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 20 })
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'varchar', length: 50 })
  type: 'general' | 'contextual' | 'strategic' | 'specific' | 'tutorial';

  @Column({ type: 'text' })
  template: string; // Template with placeholders like {{variable}}

  @Column({ type: 'jsonb', default: {} })
  variables: {
    [key: string]: {
      type: 'string' | 'number' | 'array' | 'object';
      description: string;
      required: boolean;
      defaultValue?: any;
    };
  };

  @Column({ type: 'jsonb', default: {} })
  conditions: {
    minSkillLevel?: number;
    maxSkillLevel?: number;
    requiredAttempts?: number;
    timeThreshold?: number;
    puzzleState?: any;
  };

  @Column({ type: 'int', default: 0 })
  cost: number;

  @Column({ type: 'int', default: 0 })
  pointsPenalty: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  effectiveness: number;

  @Column({ type: 'jsonb', default: {} })
  analytics: {
    averageEffectiveness?: number;
    completionRate?: number;
    userSatisfaction?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
