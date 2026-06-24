import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message, MessageStatus } from './message.entity';

@Entity({ name: 'sms_receipts' })
@Index(['providerMessageId', 'createdAt'])
@Index(['status', 'createdAt'])
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Message, (message) => message.receipts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column()
  messageId: string;

  @Column()
  provider: string;

  @Column()
  providerMessageId: string;

  @Column({
    type: 'enum',
    enum: MessageStatus,
  })
  status: MessageStatus;

  @Column({ nullable: true })
  errorCode: string;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
