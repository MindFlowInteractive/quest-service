import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A chat/system message exchanged inside a co-operative puzzle session.
 * Chat history is persisted (unlike the volatile Redis state) so players who
 * reconnect can catch up and so moderation/analytics have a durable record.
 */
@Entity('puzzle_session_messages')
@Index(['sessionId', 'createdAt'])
export class PuzzleSessionMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  @Index()
  sessionId: string;

  @Column({ name: 'user_id', length: 128 })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 16, default: 'chat' })
  type: 'chat' | 'system';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
