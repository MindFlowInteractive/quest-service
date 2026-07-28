import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('dead_letter_events')
export class DeadLetterEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'text' })
  error: string;

  @CreateDateColumn({ type: 'timestamp' })
  failedAt: Date;
}
