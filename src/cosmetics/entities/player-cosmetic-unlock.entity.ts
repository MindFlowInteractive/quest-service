import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Records that a player owns a title or cosmetic item. */
@Entity('player_cosmetic_unlocks')
@Index(['userId', 'cosmeticId'], { unique: true })
export class PlayerCosmeticUnlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'cosmetic_id', type: 'uuid' })
  cosmeticId: string;

  /** "milestone" for automatic unlocks, otherwise the grant source */
  @Column({ type: 'varchar', length: 64, default: 'milestone' })
  source: string;

  @CreateDateColumn({ name: 'unlocked_at', type: 'timestamp with time zone' })
  unlockedAt: Date;
}
