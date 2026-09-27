import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { BattlePass } from './battle-pass.entity';

@Entity('player_battle_passes')
@Unique(['userId', 'battlePassId'])
@Index(['userId', 'battlePassId'])
export class PlayerBattlePass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  battlePassId: string;

  @Column({ type: 'boolean', default: false })
  isPremium: boolean; // Has the user purchased the premium track?

  @Column({ type: 'int', default: 0 })
  currentXp: number;

  @Column({ type: 'int', default: 0 })
  currentTier: number; // 0-based (0 = no tier unlocked)

  @Column({ type: 'jsonb', default: [] })
  claimedFreeRewards: string[]; // tier IDs

  @Column({ type: 'jsonb', default: [] })
  claimedPremiumRewards: string[]; // tier IDs

  @Column({ type: 'timestamp with time zone', nullable: true })
  premiumPurchasedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  retroactivePurchaseGrantedAt?: Date; // When retroactive rewards were granted

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => BattlePass, (bp) => bp.playerProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'battlePassId' })
  battlePass: BattlePass;
}
