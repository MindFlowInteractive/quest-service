import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum OnChainEventType {
  REWARD_CLAIMED = 'RewardClaimed',
  ACHIEVEMENT_UNLOCKED = 'AchievementUnlocked',
  NFT_MINTED = 'NFTMinted',
  TOURNAMENT_COMPLETED = 'TournamentCompleted',
  STAKE_DEPOSITED = 'StakeDeposited',
}

export enum EventProcessingStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('onchain_events')
@Index(['contractAddress'])
@Index(['eventType'])
@Index(['txHash'], { unique: true })
@Index(['ledger'])
@Index(['status'])
@Index(['processedAt'])
@Index(['contractAddress', 'eventType'])
@Index(['ledger', 'status'])
export class OnChainEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_address' })
  contractAddress: string;

  @Column({
    type: 'enum',
    enum: OnChainEventType,
  })
  eventType: OnChainEventType;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ name: 'ledger', type: 'bigint' })
  ledger: number;

  @Column({ name: 'tx_hash' })
  txHash: string;

  @Column({
    type: 'enum',
    enum: EventProcessingStatus,
    default: EventProcessingStatus.PENDING,
  })
  status: EventProcessingStatus;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt: Date;

  @Column({ name: 'paging_token', nullable: true })
  pagingToken: string;

  @Column({ name: 'network', default: 'testnet' })
  network: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
