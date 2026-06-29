import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('xp_awards')
@Index(['userId', 'sourceEventId'], { unique: true })
export class XpAward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'source_event_id', type: 'varchar', length: 255 })
  sourceEventId: string;

  @Column({ type: 'varchar', length: 64 })
  reason: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
