import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CosmeticType, UnlockCondition } from '../cosmetics.types';

/** A title or cosmetic item in the catalog. */
@Entity('cosmetic_items')
export class CosmeticItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable identifier, e.g. "title-puzzle-master" */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  slug: string;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  type: CosmeticType;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Text shown on the profile for titles, e.g. "Puzzle Master" */
  @Column({
    name: 'display_text',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  displayText: string | null;

  /** Extra render data for non-title items, e.g. { color: '#ffcc00' } */
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'common' })
  rarity: string;

  @Column({ name: 'unlock_condition', type: 'jsonb' })
  unlockCondition: UnlockCondition;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
