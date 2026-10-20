import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { DifficultyLevel, PuzzleType } from '../types/puzzle.types';

@Entity('practice_sessions')
@Index(['playerId', 'updatedAt'])
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  playerId: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  puzzleId: string;

  @Column({ type: 'varchar', length: 50 })
  puzzleType: PuzzleType;

  @Column({ type: 'int' })
  difficulty: DifficultyLevel;

  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ type: 'jsonb' })
  solution: unknown;

  @Column({ type: 'jsonb', default: [] })
  hints: string[];

  @Column({ type: 'varchar', nullable: true })
  solutionGuide?: string;

  @Column({ type: 'int', default: 0 })
  attemptsCount: number;

  @Column({ type: 'int', default: 0 })
  correctAttempts: number;

  @Column({ type: 'int', default: 0 })
  hintsRequested: number;

  @Column({ type: 'int', default: 0 })
  replays: number;

  @Column({ type: 'int', default: 0 })
  totalTimeSpent: number;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'timestamp with time zone' })
  startedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
