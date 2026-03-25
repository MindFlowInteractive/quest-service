import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type PlayerActionEventType =
  | 'puzzle.started'
  | 'puzzle.solved'
  | 'puzzle.abandoned'
  | 'hint.used'
  | 'answer.submitted'
  | 'achievement.unlocked';

@Entity('player_action_events')
@Index(['userId', 'eventType', 'timestamp'])
export class PlayerActionEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  sessionId: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  eventType: PlayerActionEventType;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  timestamp: Date;
}
