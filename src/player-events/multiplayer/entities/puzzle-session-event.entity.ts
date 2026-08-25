import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('puzzle_session_events')
export class PuzzleSessionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'user_id', nullable: true, length: 128 })
  userId: string | null;

  @Column({ length: 64 })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
