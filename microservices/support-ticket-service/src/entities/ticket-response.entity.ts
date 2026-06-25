import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { SupportTicket } from './ticket.entity';

@Entity('ticket_responses')
export class TicketResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @Column({ default: false })
  isAgent: boolean;

  @Column({ type: 'text' })
  message: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.responses, { onDelete: 'CASCADE' })
  ticket: SupportTicket;

  @CreateDateColumn()
  createdAt: Date;
}