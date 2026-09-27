import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';

export enum ItemCategory {
  ACHIEVEMENT = 'achievement',
  COLLECTIBLE = 'collectible',
  CONSUMABLE = 'consumable',
  COSMETIC = 'cosmetic',
  CURRENCY = 'currency',
  EQUIPMENT = 'equipment',
}

@Entity('player_inventories')
@Unique(['userId'])
export class PlayerInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'int', default: 100 })
  maxSlots: number;

  @Column({ type: 'int', default: 0 })
  usedSlots: number;

  @Column({ type: 'jsonb', default: {} })
  analytics: {
    totalItemsEverAcquired?: number;
    categoryBreakdown?: Record<string, number>;
    mostPopularCategory?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => InventoryItem, (item) => item.inventory, { cascade: true })
  items: InventoryItem[];
}
