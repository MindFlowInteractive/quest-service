import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsArray,
  ValidateNested,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LineItem } from '../../providers/payment-provider.interface';

export class LineItemDto implements LineItem {
  @IsString()
  description: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsNumber()
  @IsPositive()
  amount: number;
}

export class CreateInvoiceDto {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems: LineItemDto[];

  @IsString()
  currency: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;
}
