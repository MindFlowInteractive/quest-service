import { IsString, IsNumber, IsEnum, Min, IsUUID } from 'class-validator';
import { BoostType } from './entities/boost.entity';

export class ConsumeEnergyDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}

export class RefillEnergyDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}

export class GiftEnergyDto {
  @IsUUID()
  fromUserId: string;

  @IsUUID()
  toUserId: string;

  @IsNumber()
  @Min(1)
  amount: number;
}

export class ApplyBoostDto {
  @IsUUID()
  userId: string;

  @IsEnum(BoostType)
  type: BoostType;

  @IsNumber()
  @Min(1)
  multiplier: number;

  @IsNumber()
  @Min(1)
  durationMinutes: number;
}
