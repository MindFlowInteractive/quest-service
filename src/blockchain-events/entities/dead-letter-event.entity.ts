import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('dead_letter_events')
@Index(['originalEventId'])
@Index(['eventType'])
@Index(['status'])
@Index(['createdAt'])
export class DeadLetterEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'original_event_id' })
  originalEventId: string;

  @Column({ name: 'contract_address' })
  contractAddress: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ name: 'ledger', type: 'bigint' })
  ledger: number;

  @Column({ name: 'tx_hash' })
  txHash: string;

  @Column({ name: 'error_message', type: 'text' })
  errorMessage: string;

  @Column({ name: 'error_stack', type: 'text', nullable: true })
  errorStack: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'retrying', 'manual_review', 'resolved'],
    default: 'pending',
  })
  status: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'last_retry_at', type: 'timestamptz', nullable: true })
  lastRetryAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ name: 'network', default: 'testnet' })
  network: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
