import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Assessment } from '../../assessment/entities/assessment.entity';
import { Test } from '../../test/entities/test.entity';

@Entity('results')
export class Result {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  assessmentId: string;

  @Column()
  testId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'int' })
  timeTaken: number;

  @Column({ type: 'int' })
  questionsAnswered: number;

  @Column({ type: 'int' })
  correctAnswers: number;

  @Column({ type: 'json' })
  answers: Array<{
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }>;

  @Column({ type: 'json', nullable: true })
  performanceMetrics: Record<string, number>;

  @ManyToOne(() => Assessment, (assessment) => assessment.results)
  @JoinColumn({ name: 'assessmentId' })
  assessment: Assessment;

  @ManyToOne(() => Test)
  @JoinColumn({ name: 'testId' })
  test: Test;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
