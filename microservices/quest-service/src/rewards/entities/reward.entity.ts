import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('rewards')
@Index(['userId', 'createdAt'])
@Index(['type', 'status'])
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  type: 'token' | 'nft' | 'achievement' | 'bonus';

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  @Index()
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  amount?: number; // For token rewards

  @Column({ type: 'int', nullable: true })
  tokenId?: number; // For NFT rewards

  @Column({ type: 'uuid', nullable: true })
  achievementId?: string; // For achievement rewards

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionHash?: string; // Blockchain transaction hash

  @Column({ type: 'varchar', length: 255, nullable: true })
  contractId?: string; // Smart contract ID

  @Column({ type: 'text', nullable: true })
  metadata?: string; // JSON metadata

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string; // Reason for the reward

  @Column({ type: 'varchar', length: 255, nullable: true })
  puzzleId?: string; // Related puzzle ID

  @Column({ type: 'timestamp with time zone', nullable: true })
  processedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  claimedAt?: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}