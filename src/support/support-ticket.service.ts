import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { NotificationService } from '../notifications/notification.service';

export const SUPPORT_TICKET_EVENTS = {
  STAFF_REPLIED: 'support.ticket.staff_replied',
  STATUS_CHANGED: 'support.ticket.status_changed',
};

@Injectable()
export class SupportTicketService {
  private readonly logger = new Logger(SupportTicketService.name);

  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepo: Repository<TicketMessage>,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Ticket CRUD ─────────────────────────────────────────────────────────────

  async createTicket(
    playerId: string,
    dto: CreateTicketDto,
  ): Promise<SupportTicket> {
    const ticket = this.ticketRepo.create({
      playerId,
      category: dto.category,
      subject: dto.subject,
      description: dto.description,
      status: TicketStatus.OPEN,
    });
    const saved = await this.ticketRepo.save(ticket);
    this.logger.log(`Ticket created: ${saved.id} by player ${playerId}`);
    return saved;
  }

  async getTickets(
    requesterId: string,
    isStaff: boolean,
    query: TicketQueryDto,
  ): Promise<{ tickets: SupportTicket[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<SupportTicket> = {};

    // Players can only see their own tickets
    if (!isStaff) {
      where.playerId = requesterId;
    } else {
      // Staff filters
      if (query.status) where.status = query.status;
      if (query.category) where.category = query.category;
      if (query.assignee) where.assignedTo = query.assignee;
    }

    const [tickets, total] = await this.ticketRepo.findAndCount({
      where,
      relations: ['messages'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { tickets, total };
  }

  async getTicketById(
    ticketId: string,
    requesterId: string,
    isStaff: boolean,
  ): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['messages'],
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    if (!isStaff && ticket.playerId !== requesterId) {
      throw new ForbiddenException('Access denied');
    }

    return ticket;
  }

  async updateTicket(
    ticketId: string,
    staffId: string,
    dto: UpdateTicketDto,
  ): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const previousStatus = ticket.status;

    if (dto.status !== undefined) ticket.status = dto.status;
    if (dto.assignedTo !== undefined) ticket.assignedTo = dto.assignedTo;

    const updated = await this.ticketRepo.save(ticket);

    // Notify player on status change
    if (dto.status !== undefined && dto.status !== previousStatus) {
      await this.notifyPlayer(updated, 'status_changed', previousStatus);
      this.eventEmitter.emit(SUPPORT_TICKET_EVENTS.STATUS_CHANGED, {
        ticket: updated,
        previousStatus,
        changedBy: staffId,
      });
    }

    return updated;
  }

  // ─── Messages ────────────────────────────────────────────────────────────────

  async addMessage(
    ticketId: string,
    authorId: string,
    isStaff: boolean,
    dto: CreateMessageDto,
  ): Promise<TicketMessage> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // Players can only message their own tickets
    if (!isStaff && ticket.playerId !== authorId) {
      throw new ForbiddenException('Access denied');
    }

    const message = this.messageRepo.create({
      ticketId,
      authorId,
      body: dto.body,
      isStaff,
    });
    const saved = await this.messageRepo.save(message);

    // Auto-reopen if resolved/closed and player replies
    if (
      !isStaff &&
      (ticket.status === TicketStatus.RESOLVED ||
        ticket.status === TicketStatus.CLOSED)
    ) {
      await this.ticketRepo.update(ticketId, { status: TicketStatus.OPEN });
    }

    // Notify player when staff replies
    if (isStaff) {
      await this.notifyPlayer(ticket, 'staff_replied');
      this.eventEmitter.emit(SUPPORT_TICKET_EVENTS.STAFF_REPLIED, {
        ticket,
        message: saved,
        staffId: authorId,
      });
    }

    return saved;
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  async getStats(): Promise<{
    openCount: number;
    avgResolutionTimeSeconds: number;
    ticketsByCategory: Record<string, number>;
  }> {
    const openCount = await this.ticketRepo.count({
      where: { status: TicketStatus.OPEN },
    });

    // Average resolution time (open → resolved/closed), in seconds
    const avgResult = await this.ticketRepo
      .createQueryBuilder('t')
      .select(
        'AVG(EXTRACT(EPOCH FROM (t.updatedAt - t.createdAt)))',
        'avgSeconds',
      )
      .where('t.status IN (:...statuses)', {
        statuses: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
      })
      .getRawOne();

    const avgResolutionTimeSeconds = avgResult?.avgSeconds
      ? parseFloat(avgResult.avgSeconds)
      : 0;

    // Tickets grouped by category
    const categoryRaw = await this.ticketRepo
      .createQueryBuilder('t')
      .select('t.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.category')
      .getRawMany();

    const ticketsByCategory = categoryRaw.reduce(
      (acc: Record<string, number>, row: { category: string; count: string }) => {
        acc[row.category] = parseInt(row.count, 10);
        return acc;
      },
      {},
    );

    return { openCount, avgResolutionTimeSeconds, ticketsByCategory };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async notifyPlayer(
    ticket: SupportTicket,
    event: 'staff_replied' | 'status_changed',
    previousStatus?: TicketStatus,
  ): Promise<void> {
    try {
      const title =
        event === 'staff_replied'
          ? `New reply on ticket: ${ticket.subject}`
          : `Ticket status updated: ${ticket.subject}`;

      const body =
        event === 'staff_replied'
          ? 'A support agent has replied to your ticket.'
          : `Your ticket status changed from ${previousStatus} to ${ticket.status}.`;

      const notification = this.notificationService['notificationRepo'].create({
        userId: ticket.playerId,
        type: `support_ticket_${event}`,
        title,
        body,
        meta: { ticketId: ticket.id, status: ticket.status },
      });

      await this.notificationService['notificationRepo'].save(notification);
      await this.notificationService['recordDelivery'](
        notification.id,
        'in_app',
        'delivered',
      );
    } catch (err) {
      this.logger.error(`Failed to send ticket notification: ${err}`);
    }
  }
}
