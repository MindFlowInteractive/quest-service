import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ShopItemType {
  HINT = 'hint',
  POWER_UP = 'power_up',
  COSMETIC = 'cosmetic',
  ENERGY_REFILL = 'energy_refill',
}

export enum ShopItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LIMITED = 'limited',
}

@Entity('shop_items')
export class ShopItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ShopItemType,
  })
  itemType: ShopItemType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'coins' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ShopItemStatus,
    default: ShopItemStatus.ACTIVE,
  })
  status: ShopItemStatus;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  maxPurchaseLimit: number;

  @Column({ default: 0 })
  currentPurchaseCount: number;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
