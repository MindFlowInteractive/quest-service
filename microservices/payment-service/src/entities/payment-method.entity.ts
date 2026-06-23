import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentMethodType } from '../providers/payment-provider.interface';

@Entity('payment_methods')
@Index(['userId', 'isDefault'])
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: 'stripe' })
  provider: string;

  @Column()
  externalMethodId: string;

  @Column({ type: 'varchar', default: 'card' })
  type: PaymentMethodType;

  @Column({ nullable: true })
  last4: string | null;

  @Column({ nullable: true })
  brand: string | null;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
