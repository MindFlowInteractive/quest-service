import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus, TransactionType, TransactionCategory } from '../entities/blockchain-transaction.entity';

export class TransactionQueryDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsEnum(TransactionCategory)
  @IsOptional()
  category?: TransactionCategory;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  sourceAccount?: string;

  @IsString()
  @IsOptional()
  destinationAccount?: string;

  @IsString()
  @IsOptional()
  transactionHash?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
