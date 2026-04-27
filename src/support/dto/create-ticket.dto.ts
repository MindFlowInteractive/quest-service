import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketCategory } from '../entities/support-ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ enum: TicketCategory, description: 'Ticket category' })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiProperty({ description: 'Brief subject of the ticket', maxLength: 255 })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  subject: string;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  @MinLength(10)
  description: string;
}
