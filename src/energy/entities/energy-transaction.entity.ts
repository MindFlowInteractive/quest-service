import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EnergyTransactionType {
  CONSUMPTION = 'consumption',
  REGENERATION = 'regeneration',
  TOKEN_REFILL = 'token_refill',
  GIFT_SENT = 'gift_sent',
  GIFT_RECEIVED = 'gift_received',
  BOOST_APPLIED = 'boost_applied',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Entity('energy_transactions')
@Index(['userId', 'createdAt'])
@Index(['transactionType', 'createdAt'])
export class EnergyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: EnergyTransactionType,
  })
  transactionType: EnergyTransactionType;

  @Column({ name: 'amount', type: 'integer' })
  amount: number; // Positive for gains, negative for consumption

  @Column({ name: 'energy_before', type: 'integer' })
  energyBefore: number;

  @Column({ name: 'energy_after', type: 'integer' })
  energyAfter: number;

  @Column({ name: 'related_entity_id', type: 'uuid', nullable: true })
  relatedEntityId: string | null; // Puzzle ID, Gift ID, etc.

  @Column({ name: 'related_entity_type', type: 'varchar', length: 50, nullable: true })
  relatedEntityType: string | null; // 'puzzle', 'gift', 'boost', etc.

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}