import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_energy')
@Index(['userId'])
export class UserEnergy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'current_energy', type: 'integer', default: 100 })
  currentEnergy: number;

  @Column({ name: 'max_energy', type: 'integer', default: 100 })
  maxEnergy: number;

  @Column({ name: 'last_regeneration', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  lastRegeneration: Date;

  @Column({ name: 'regeneration_rate', type: 'integer', default: 1 })
  regenerationRate: number; // Energy points per regeneration interval

  @Column({ name: 'regeneration_interval_minutes', type: 'integer', default: 30 })
  regenerationIntervalMinutes: number;

  @Column({ name: 'energy_gifts_sent_today', type: 'integer', default: 0 })
  energyGiftsSentToday: number;

  @Column({ name: 'energy_gifts_received_today', type: 'integer', default: 0 })
  energyGiftsReceivedToday: number;

  @Column({ name: 'last_gift_reset', type: 'date', default: () => 'CURRENT_DATE' })
  lastGiftReset: Date;

  @Column({ name: 'boost_multiplier', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  boostMultiplier: number;

  @Column({ name: 'boost_expires_at', type: 'timestamp with time zone', nullable: true })
  boostExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}