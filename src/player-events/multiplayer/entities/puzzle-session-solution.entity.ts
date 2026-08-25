import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('puzzle_session_solutions')
export class PuzzleSessionSolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'user_id', length: 128 })
  userId: string;

  @Column({ name: 'step_id', nullable: true, length: 128 })
  stepId: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_correct', default: false })
  isCorrect: boolean;

  @Column({ name: 'confidence', type: 'float', nullable: true })
  confidence: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
