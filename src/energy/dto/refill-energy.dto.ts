import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefillEnergyDto {
  @ApiProperty({ description: 'Number of tokens to spend on energy refill', minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  tokensToSpend: number;
}