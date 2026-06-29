import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum SmsReceiptStatus {
  ACCEPTED = 'accepted',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'sms_receipts' })
@Index(['messageId', 'createdAt'])
@Index(['providerMessageId'])
export class SmsReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  messageId: string;

  @Column({ nullable: true })
  providerMessageId: string;

  @Column({ nullable: true })
  provider: string;

  @Column({
    type: 'simple-enum',
    enum: SmsReceiptStatus,
  })
  status: SmsReceiptStatus;

  @Column()
  eventType: string;

  @Column({ nullable: true })
  errorCode: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  occurredAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  rawPayload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
