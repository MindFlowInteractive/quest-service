import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  inventoryId: string;

  @Column({ type: 'int', default: 0 })
  totalQuantity: number;

  @Column({ type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ type: 'int', default: 0 })
  availableQuantity: number;

  @Column({ type: 'int', default: 0 })
  backOrderQuantity: number;

  @Column({ type: 'timestamp', nullable: true })
  lastStockUpdate: Date;

  @ManyToOne(() => Inventory, (inventory) => inventory.stocks, { onDelete: 'CASCADE' })
  inventory: Inventory;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}