import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TestCategory {
  LOGIC = 'logic',
  PROBLEM_SOLVING = 'problem_solving',
  PATTERN_RECOGNITION = 'pattern_recognition',
  MEMORY = 'memory',
  ATTENTION = 'attention',
  REACTION_TIME = 'reaction_time',
}

export enum TestDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
  EXPERT = 4,
  MASTER = 5,
}

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TestCategory,
  })
  category: TestCategory;

  @Column({
    type: 'enum',
    enum: TestDifficulty,
    default: TestDifficulty.EASY,
  })
  difficulty: TestDifficulty;

  @Column({ type: 'int' })
  timeLimit: number;

  @Column({ type: 'int', default: 0 })
  minScore: number;

  @Column({ type: 'int', default: 100 })
  maxScore: number;

  @Column({ type: 'json' })
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }>;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
