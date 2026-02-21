import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TransactionType, TransactionCategory } from '../entities/blockchain-transaction.entity';

export enum AnalyticsPeriod {
  HOUR = '1h',
  DAY = '24h',
  WEEK = '7d',
  MONTH = '30d',
  YEAR = '1y',
}

export class TransactionAnalyticsQueryDto {
  @IsEnum(AnalyticsPeriod)
  @IsOptional()
  period?: AnalyticsPeriod = AnalyticsPeriod.DAY;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

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
  groupBy?: 'type' | 'category' | 'status' | 'hour' | 'day' = 'day';
}

export interface TransactionAnalytics {
  period: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalVolume: string;
  averageFee: number;
  transactionsByType: Record<string, number>;
  transactionsByCategory: Record<string, number>;
  transactionsByStatus: Record<string, number>;
  hourlyBreakdown?: Array<{
    hour: string;
    count: number;
    volume: string;
  }>;
  dailyBreakdown?: Array<{
    date: string;
    count: number;
    volume: string;
  }>;
}
