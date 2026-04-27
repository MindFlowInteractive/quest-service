import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '../entities/support-ticket.entity';

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus, description: 'New ticket status' })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ description: 'UUID of the support agent to assign the ticket to' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
