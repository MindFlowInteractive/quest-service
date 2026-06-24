import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { Stock } from '../../stock/entities/stock.entity';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum ReservationType {
  PURCHASE = 'PURCHASE',
  HOLD = 'HOLD',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  inventoryId: string;

  @Column({ type: 'uuid' })
  @Index()
  stockId: string;

  @Column({ type: 'uuid' })
  @Index()
  orderId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({
    type: 'enum',
    enum: ReservationType,
    default: ReservationType.PURCHASE,
  })
  type: ReservationType;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  fulfilledAt: Date;

  @ManyToOne(() => Inventory, { onDelete: 'CASCADE' })
  inventory: Inventory;

  @ManyToOne(() => Stock, { onDelete: 'CASCADE' })
  stock: Stock;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}