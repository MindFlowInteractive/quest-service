import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { InvoiceStatus, LineItem } from '../providers/payment-provider.interface';

@Entity('invoices')
@Index(['userId', 'createdAt'])
@Index(['invoiceNumber'], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  paymentId: string | null;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: InvoiceStatus;

  @Column({ type: 'jsonb', default: '[]' })
  lineItems: LineItem[];

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
