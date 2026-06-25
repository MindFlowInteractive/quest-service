import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Stock } from '../../stock/entities/stock.entity';

export enum ItemType {
  MARKETPLACE = 'MARKETPLACE',
  STORE = 'STORE',
}

export enum ItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

@Entity('inventories')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ItemType,
  })
  type: ItemType;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.ACTIVE,
  })
  status: ItemStatus;

  @Column({ type: 'uuid', nullable: true })
  marketplaceId: string;

  @Column({ type: 'uuid', nullable: true })
  storeId: string;

  @Column({ type: 'int', default: 0 })
  lowStockThreshold: number;

  @OneToMany(() => Stock, (stock) => stock.inventory)
  stocks: Stock[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}