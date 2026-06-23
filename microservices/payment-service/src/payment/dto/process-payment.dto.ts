import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsObject,
  MinLength,
} from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class RefundPaymentDto {
  @IsString()
  @MinLength(1)
  transactionId: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;
}
