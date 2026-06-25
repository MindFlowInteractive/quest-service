import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '../entities/ticket.entity';
import { TicketResponse } from '../entities/ticket-response.entity';
import { TicketStatus, TicketPriority, TicketCategory } from '../interfaces/ticket.interface';

@Injectable()
export class SupportTicketService {
  constructor(
    @InjectRepository(SupportTicket) private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(TicketResponse) private readonly responseRepo: Repository<TicketResponse>,
  ) {}

  private calculateSlaTime(priority: TicketPriority): Date {
    const now = new Date();
    switch (priority) {
      case TicketPriority.CRITICAL: return new Date(now.getTime() + 2 * 60 * 60 * 1000);   // 2 Hours
      case TicketPriority.HIGH:     return new Date(now.getTime() + 8 * 60 * 60 * 1000);   // 8 Hours
      case TicketPriority.MEDIUM:   return new Date(now.getTime() + 24 * 60 * 60 * 1000);  // 24 Hours
      case TicketPriority.LOW:      return new Date(now.getTime() + 72 * 60 * 60 * 1000);  // 72 Hours
    }
  }

  async createTicket(dto: { playerId: string; title: string; description: string; category: TicketCategory; priority?: TicketPriority }) {
    const priority = dto.priority || TicketPriority.MEDIUM;
    const slaBreachTime = this.calculateSlaTime(priority);

    const ticket = this.ticketRepo.create({
      ...dto,
      priority,
      slaBreachTime,
      historyLogs: [{ status: TicketStatus.OPEN, updatedBy: dto.playerId, timestamp: new Date(), note: 'Ticket initialized.' }]
    });

    return this.ticketRepo.save(ticket);
  }

  async assignToAgent(ticketId: string, agentId: string) {
    const ticket = await this.ticketRepo.findOneBy({ id: ticketId });
    if (!ticket) throw new NotFoundException('Target ticket profile not resolved.');

    ticket.assignedAgentId = agentId;
    ticket.status = TicketStatus.IN_PROGRESS;
    ticket.historyLogs.push({ status: TicketStatus.IN_PROGRESS, updatedBy: agentId, timestamp: new Date(), note: `Assigned to agent ${agentId}.` });

    return this.ticketRepo.save(ticket);
  }

  async addResponse(ticketId: string, dto: { senderId: string; isAgent: boolean; message: string }) {
    const ticket = await this.ticketRepo.findOneBy({ id: ticketId });
    if (!ticket) throw new NotFoundException('Target ticket profile not resolved.');

    if (ticket.status === TicketStatus.CLOSED) throw new BadRequestException('Cannot append responses onto locked/closed communication links.');

    const response = this.responseRepo.create({ ...dto, ticket });
    await this.responseRepo.save(response);

    ticket.status = dto.isAgent ? TicketStatus.PENDING_CUSTOMER : TicketStatus.OPEN;
    return this.ticketRepo.save(ticket);
  }

  async updateStatus(ticketId: string, status: TicketStatus, updatedBy: string) {
    const ticket = await this.ticketRepo.findOneBy({ id: ticketId });
    if (!ticket) throw new NotFoundException('Ticket context mismatch.');

    ticket.status = status;
    ticket.historyLogs.push({ status, updatedBy, timestamp: new Date() });

    return this.ticketRepo.save(ticket);
  }

  async submitCsaRating(ticketId: string, rating: number) {
    const ticket = await this.ticketRepo.findOneBy({ id: ticketId });
    if (!ticket) throw new NotFoundException('Ticket missing.');
    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException('Ratings can only be gathered against finished or processed issues.');
    }

    ticket.satisfactionRating = rating;
    return this.ticketRepo.save(ticket);
  }
}