import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PlayerInventory, ItemCategory } from './player-inventory.entity';

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Entity('inventory_items')
@Index(['inventoryId', 'category'])
@Index(['inventoryId', 'rarity'])
@Index(['itemId'])
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  inventoryId: string;

  @Column({ type: 'uuid' })
  @Index()
  itemId: string; // External item reference

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ItemCategory,
    default: ItemCategory.COLLECTIBLE,
  })
  @Index()
  category: ItemCategory;

  @Column({
    type: 'enum',
    enum: ItemRarity,
    default: ItemRarity.COMMON,
  })
  @Index()
  rarity: ItemRarity;

  @Column({ type: 'int', default: 1 })
  quantity: number; // For stackable items

  @Column({ type: 'int', nullable: true })
  maxStack?: number; // null = unlimited stacking

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Arbitrary item data

  @Column({ type: 'boolean', default: false })
  isEquipped: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  acquiredAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date; // null = never expires

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PlayerInventory, (inv) => inv.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventoryId' })
  inventory: PlayerInventory;
}
