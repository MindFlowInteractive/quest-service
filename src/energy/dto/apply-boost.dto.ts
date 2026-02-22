import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApplyBoostDto {
  @ApiProperty({ description: 'ID of the energy boost to apply' })
  @IsUUID()
  boostId: string;
}