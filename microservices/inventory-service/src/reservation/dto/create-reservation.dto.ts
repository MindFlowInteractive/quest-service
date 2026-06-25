import { IsUUID, IsNumber, IsPositive, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationType } from '../entities/reservation.entity';

export class CreateReservationDto {
  @ApiProperty()
  @IsUUID()
  inventoryId: string;

  @ApiProperty()
  @IsUUID()
  orderId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ default: ReservationType.PURCHASE })
  @IsEnum(ReservationType)
  @IsOptional()
  type?: ReservationType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  holdDurationMinutes: number;
}

export class ConfirmReservationDto {
  @ApiProperty()
  @IsUUID()
  reservationId: string;
}