import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('reward_queue')
@Index(['status', 'priority'])
@Index(['scheduledAt'])
export class RewardQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  type: 'token' | 'nft' | 'achievement' | 'bonus';

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  amount?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  puzzleId?: string;

  @Column({ type: 'varchar', length: 20, default: 'low' })
  @Index()
  priority: 'low' | 'normal' | 'high' | 'critical';

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  @Index()
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  scheduledAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}