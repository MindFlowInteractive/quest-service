import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';

@Entity('ticket_messages')
@Index(['ticketId'])
@Index(['authorId'])
export class TicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @Column({ type: 'uuid' })
  authorId: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: false })
  isStaff: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
