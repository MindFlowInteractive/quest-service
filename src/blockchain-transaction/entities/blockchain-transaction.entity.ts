import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  NFT_MINT = 'nft_mint',
  NFT_TRANSFER = 'nft_transfer',
  NFT_BURN = 'nft_burn',
  TOKEN_TRANSFER = 'token_transfer',
  TOKEN_PAYMENT = 'token_payment',
  CONTRACT_INVOKE = 'contract_invoke',
  CONTRACT_CREATE = 'contract_create',
  ACCOUNT_CREATE = 'account_create',
  ACCOUNT_MERGE = 'account_merge',
  PATH_PAYMENT = 'path_payment',
  OFFER_CREATE = 'offer_create',
  OFFER_REMOVE = 'offer_remove',
  UNKNOWN = 'unknown',
}

export enum TransactionCategory {
  GAME_REWARD = 'game_reward',
  PURCHASE = 'purchase',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  ACHIEVEMENT = 'achievement',
  TOURNAMENT = 'tournament',
  REFERRAL = 'referral',
  SYSTEM = 'system',
  USER = 'user',
}

@Entity('blockchain_transactions')
@Index(['transactionHash'])
@Index(['userId'])
@Index(['status'])
@Index(['type'])
@Index(['category'])
@Index(['createdAt'])
@Index(['userId', 'status'])
@Index(['type', 'status'])
export class BlockchainTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_hash', unique: true })
  transactionHash: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.UNKNOWN,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
    default: TransactionCategory.USER,
  })
  category: TransactionCategory;

  @Column({ name: 'source_account' })
  sourceAccount: string;

  @Column({ name: 'destination_account', nullable: true })
  destinationAccount: string;

  @Column({ type: 'decimal', precision: 20, scale: 7, nullable: true })
  amount: string;

  @Column({ name: 'asset_code', nullable: true })
  assetCode: string;

  @Column({ name: 'asset_issuer', nullable: true })
  assetIssuer: string;

  @Column({ name: 'ledger_sequence', type: 'bigint', nullable: true })
  ledgerSequence: number;

  @Column({ name: 'memo', nullable: true })
  memo: string;

  @Column({ name: 'memo_type', nullable: true })
  memoType: string;

  @Column({ name: 'fee_charged', type: 'bigint', nullable: true })
  feeCharged: number;

  @Column({ name: 'operation_count', type: 'int', default: 0 })
  operationCount: number;

  @Column({ name: 'contract_id', nullable: true })
  contractId: string;

  @Column({ name: 'function_name', nullable: true })
  functionName: string;

  @Column({ type: 'jsonb', name: 'function_args', nullable: true })
  functionArgs: any;

  @Column({ type: 'jsonb', name: 'operation_results', nullable: true })
  operationResults: any;

  @Column({ type: 'jsonb', name: 'raw_envelope', nullable: true })
  rawEnvelope: any;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt: Date;

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
