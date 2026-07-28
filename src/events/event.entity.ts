import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  topic: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;
}
