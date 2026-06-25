import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TicketStatus, TicketPriority, TicketCategory } from '../interfaces/ticket.interface';
import { TicketResponse } from './ticket-response.entity';

@Entity('tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  playerId: string;

  @Column({ type: 'varchar' })
  category: TicketCategory;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'varchar', default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ nullable: true })
  assignedAgentId: string;

  @Column({ type: 'timestamp' })
  slaBreachTime: Date;

  @Column({ default: false })
  isSlaBreached: boolean;

  @Column({ type: 'int', nullable: true })
  satisfactionRating: number; // 1-5 scale rating

  @Column({ type: 'jsonb', default: [] })
  historyLogs: Array<{ status: string; updatedBy: string; timestamp: Date; note?: string }>;

  @OneToMany(() => TicketResponse, (response) => response.ticket, { cascade: true })
  responses: TicketResponse[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}