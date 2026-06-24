import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  MinLength,
} from 'class-validator';
import { PaymentMethodType } from '../../providers/payment-provider.interface';

export class CreatePaymentMethodDto {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsString()
  externalMethodId: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsIn(['card', 'paypal', 'bank_account'])
  type: PaymentMethodType;

  @IsOptional()
  @IsString()
  last4?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
