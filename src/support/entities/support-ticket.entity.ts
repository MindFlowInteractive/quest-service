import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TicketMessage } from './ticket-message.entity';

export enum TicketCategory {
  BUG = 'bug',
  BILLING = 'billing',
  ACCOUNT = 'account',
  GAMEPLAY = 'gameplay',
  OTHER = 'other',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('support_tickets')
@Index(['playerId'])
@Index(['status'])
@Index(['category'])
@Index(['assignedTo'])
@Index(['createdAt'])
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'enum', enum: TicketCategory })
  category: TicketCategory;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedTo?: string;

  @OneToMany(() => TicketMessage, (msg) => msg.ticket, { cascade: true })
  messages: TicketMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
