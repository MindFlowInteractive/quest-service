import { IsOptional, IsString } from 'class-validator';

export class RecordTransactionDto {
  @IsString()
  assetCode: string;

  @IsOptional()
  @IsString()
  issuer?: string;

  @IsString()
  amount: string;

  @IsString()
  transactionHash: string;
}
