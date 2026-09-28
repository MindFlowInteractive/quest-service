import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BattlePassTier } from './battle-pass-tier.entity';
import { PlayerBattlePass } from './player-battle-pass.entity';

export enum BattlePassStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

@Entity('battle_passes')
@Index(['status'])
export class BattlePass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  season: string; // e.g. "2025-Q1"

  @Column({ type: 'timestamp with time zone' })
  @Index()
  startDate: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  endDate: Date;

  @Column({
    type: 'enum',
    enum: BattlePassStatus,
    default: BattlePassStatus.DRAFT,
  })
  status: BattlePassStatus;

  @Column({ type: 'int', default: 0 })
  xpPerTier: number; // XP required to advance one tier

  @Column({ type: 'int', default: 100 })
  totalTiers: number;

  @Column({ type: 'jsonb', default: {} })
  analytics: {
    totalPurchases?: number;
    premiumPurchases?: number;
    averageXpEarned?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => BattlePassTier, (tier) => tier.battlePass, { cascade: true })
  tiers: BattlePassTier[];

  @OneToMany(() => PlayerBattlePass, (p) => p.battlePass, { cascade: true })
  playerProgress: PlayerBattlePass[];
}
