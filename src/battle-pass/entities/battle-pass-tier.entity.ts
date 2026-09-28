import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BattlePass } from './battle-pass.entity';

export enum RewardTrack {
  FREE = 'free',
  PREMIUM = 'premium',
}

@Entity('battle_pass_tiers')
@Index(['battlePassId', 'tierNumber'])
export class BattlePassTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  battlePassId: string;

  @Column({ type: 'int' })
  tierNumber: number; // 1-based

  @Column({ type: 'int' })
  xpRequired: number; // Cumulative XP to reach this tier

  @Column({ type: 'jsonb', nullable: true })
  freeReward?: {
    type: 'points' | 'badge' | 'item' | 'currency' | 'title' | 'avatar';
    name: string;
    value?: number;
    imageUrl?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    metadata?: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  premiumReward?: {
    type: 'points' | 'badge' | 'item' | 'currency' | 'title' | 'avatar';
    name: string;
    value?: number;
    imageUrl?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    metadata?: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => BattlePass, (bp) => bp.tiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'battlePassId' })
  battlePass: BattlePass;
}
