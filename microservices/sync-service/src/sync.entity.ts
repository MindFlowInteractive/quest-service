import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('sync_states')
export class SyncState {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  deviceId: string;

  @Column({ type: 'jsonb', default: {} })
  data: Record<string, unknown>;

  @UpdateDateColumn()
  updatedAt: Date;
}