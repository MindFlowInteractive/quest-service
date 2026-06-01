import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Result } from '../../result/entities/result.entity';

export enum AssessmentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AssessmentType {
  INITIAL = 'initial',
  REASSESSMENT = 'reassessment',
  ADAPTIVE = 'adaptive',
}

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  playerId: string;

  @Column({
    type: 'enum',
    enum: AssessmentType,
    default: AssessmentType.INITIAL,
  })
  type: AssessmentType;

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.PENDING,
  })
  status: AssessmentStatus;

  @Column({ type: 'int', default: 1 })
  difficultyLevel: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallScore: number;

  @Column({ type: 'enum', nullable: true })
  assignedTier: SkillTier;

  @Column({ type: 'json', nullable: true })
  skillGaps: Record<string, number>;

  @Column({ type: 'int', nullable: true })
  questionsAnswered: number;

  @Column({ type: 'int', nullable: true })
  correctAnswers: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextReassessmentAt: Date;

  @OneToMany(() => Result, (result) => result.assessment, { cascade: true })
  results: Result[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum SkillTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}
