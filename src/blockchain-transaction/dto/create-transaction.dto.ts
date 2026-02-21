import { IsString, IsOptional, IsEnum, IsNumber, IsJSON, IsDate } from 'class-validator';
import { TransactionType, TransactionCategory } from '../entities/blockchain-transaction.entity';

export class CreateTransactionDto {
  @IsString()
  transactionHash: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @IsString()
  sourceAccount: string;

  @IsString()
  @IsOptional()
  destinationAccount?: string;

  @IsString()
  @IsOptional()
  amount?: string;

  @IsString()
  @IsOptional()
  assetCode?: string;

  @IsString()
  @IsOptional()
  assetIssuer?: string;

  @IsNumber()
  @IsOptional()
  ledgerSequence?: number;

  @IsString()
  @IsOptional()
  memo?: string;

  @IsString()
  @IsOptional()
  memoType?: string;

  @IsNumber()
  @IsOptional()
  feeCharged?: number;

  @IsNumber()
  @IsOptional()
  operationCount?: number;

  @IsString()
  @IsOptional()
  contractId?: string;

  @IsString()
  @IsOptional()
  functionName?: string;

  @IsOptional()
  functionArgs?: any;

  @IsOptional()
  operationResults?: any;

  @IsOptional()
  rawEnvelope?: any;

  @IsString()
  @IsOptional()
  pagingToken?: string;

  @IsString()
  @IsOptional()
  network?: string;
}
