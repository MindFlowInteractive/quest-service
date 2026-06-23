import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsIn,
  MinLength,
} from 'class-validator';
import { BillingInterval } from '../../providers/payment-provider.interface';

export class CreateSubscriptionDto {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsString()
  planId: string;

  @IsString()
  planName: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  currency: string;

  @IsIn(['month', 'year'])
  billingInterval: BillingInterval;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
