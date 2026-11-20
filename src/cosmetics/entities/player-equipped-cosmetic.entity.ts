import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CosmeticType } from '../cosmetics.types';

/** The item a player shows in one slot. One row per player per slot. */
@Entity('player_equipped_cosmetics')
@Index(['userId', 'slot'], { unique: true })
export class PlayerEquippedCosmetic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ type: 'varchar', length: 32 })
  slot: CosmeticType;

  @Column({ name: 'cosmetic_id', type: 'uuid' })
  cosmeticId: string;

  @UpdateDateColumn({ name: 'equipped_at', type: 'timestamp with time zone' })
  equippedAt: Date;
}
