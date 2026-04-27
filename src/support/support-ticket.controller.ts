import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SupportTicketService } from './support-ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/constants';

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support/tickets')
export class SupportTicketController {
  constructor(private readonly supportService: SupportTicketService) {}

  // ─── POST /support/tickets ────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Player opens a new support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async createTicket(@Request() req, @Body() dto: CreateTicketDto) {
    const ticket = await this.supportService.createTicket(req.user.id, dto);
    return { message: 'Ticket created', ticket };
  }

  // ─── GET /support/tickets/stats ──────────────────────────────────────────
  // Must be declared BEFORE /:id to avoid route collision

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Admin/staff: aggregate support ticket stats' })
  @ApiResponse({ status: 200, description: 'Stats returned successfully' })
  async getStats() {
    return this.supportService.getStats();
  }

  // ─── GET /support/tickets ─────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List tickets. Players see own; staff see all with filters',
  })
  @ApiResponse({ status: 200, description: 'Tickets returned successfully' })
  async getTickets(@Request() req, @Query() query: TicketQueryDto) {
    const isStaff =
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.MODERATOR;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { tickets, total } = await this.supportService.getTickets(
      req.user.id,
      isStaff,
      query,
    );

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── GET /support/tickets/:id ─────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ticket with its message thread' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket returned' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getTicket(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const isStaff =
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.MODERATOR;

    return this.supportService.getTicketById(id, req.user.id, isStaff);
  }

  // ─── POST /support/tickets/:id/messages ───────────────────────────────────

  @Post(':id/messages')
  @ApiOperation({ summary: 'Player or staff adds a message to a ticket thread' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 201, description: 'Message added' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async addMessage(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMessageDto,
  ) {
    const isStaff =
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.MODERATOR;

    const message = await this.supportService.addMessage(
      id,
      req.user.id,
      isStaff,
      dto,
    );

    return { message: 'Message added', data: message };
  }

  // ─── PATCH /support/tickets/:id ───────────────────────────────────────────

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Staff updates ticket status and/or assignment' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({ status: 200, description: 'Ticket updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updateTicket(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    const ticket = await this.supportService.updateTicket(id, req.user.id, dto);
    return { message: 'Ticket updated', ticket };
  }
}
