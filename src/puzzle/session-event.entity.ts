// session-event.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('session_events')
export class SessionEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: string;

  @Column()
  sequence: number;

  @Column()
  eventType: 'move' | 'hint' | 'submit' | 'pause' | 'resume';

  @Column('jsonb')
  payload: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ default: false })
  softDeleted: boolean;
}
