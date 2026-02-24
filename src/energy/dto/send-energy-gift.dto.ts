import { IsUUID, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEnergyGiftDto {
  @ApiProperty({ description: 'ID of the user to send the gift to' })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ description: 'Amount of energy to gift', default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  energyAmount?: number = 10;

  @ApiProperty({ description: 'Optional message to include with the gift', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}