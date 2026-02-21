import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  BlockchainTransaction,
  TransactionStatus,
  TransactionType,
  TransactionCategory,
} from '../entities/blockchain-transaction.entity';
import {
  TransactionAnalytics,
  TransactionAnalyticsQueryDto,
  AnalyticsPeriod,
} from '../dto/transaction-analytics.dto';

@Injectable()
export class TransactionAnalyticsService {
  private readonly logger = new Logger(TransactionAnalyticsService.name);

  constructor(
    @InjectRepository(BlockchainTransaction)
    private transactionRepository: Repository<BlockchainTransaction>,
  ) {}

  /**
   * Get comprehensive transaction analytics
   */
  async getAnalytics(query: TransactionAnalyticsQueryDto): Promise<TransactionAnalytics> {
    const { period, startDate, endDate, type, category, userId, groupBy } = query;

    // Calculate date range
    const { start, end } = this.calculateDateRange(period, startDate, endDate);

    // Build query conditions
    const where: any = {
      createdAt: Between(start, end),
    };
    if (type) where.type = type;
    if (category) where.category = category;
    if (userId) where.userId = userId;

    // Fetch transactions
    const transactions = await this.transactionRepository.find({ where });

    // Calculate metrics
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(
      tx => tx.status === TransactionStatus.CONFIRMED
    ).length;
    const failedTransactions = transactions.filter(
      tx => tx.status === TransactionStatus.FAILED
    ).length;
    const pendingTransactions = transactions.filter(
      tx => tx.status === TransactionStatus.PENDING || tx.status === TransactionStatus.PROCESSING
    ).length;

    // Calculate total volume (XLM only for simplicity)
    const totalVolume = transactions
      .filter(tx => tx.status === TransactionStatus.CONFIRMED && tx.assetCode === 'XLM')
      .reduce((sum, tx) => sum + (parseFloat(tx.amount || '0') || 0), 0)
      .toFixed(7);

    // Calculate average fee
    const averageFee = transactions.length > 0
      ? Math.round(
          transactions.reduce((sum, tx) => sum + (tx.feeCharged || 0), 0) / transactions.length
        )
      : 0;

    // Group by type
    const transactionsByType = this.groupByField(transactions, 'type');

    // Group by category
    const transactionsByCategory = this.groupByField(transactions, 'category');

    // Group by status
    const transactionsByStatus = this.groupByField(transactions, 'status');

    // Build breakdown based on groupBy
    let hourlyBreakdown: TransactionAnalytics['hourlyBreakdown'];
    let dailyBreakdown: TransactionAnalytics['dailyBreakdown'];

    if (groupBy === 'hour') {
      hourlyBreakdown = this.buildHourlyBreakdown(transactions);
    } else if (groupBy === 'day') {
      dailyBreakdown = this.buildDailyBreakdown(transactions);
    }

    return {
      period: `${start.toISOString()} to ${end.toISOString()}`,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      totalVolume,
      averageFee,
      transactionsByType,
      transactionsByCategory,
      transactionsByStatus,
      hourlyBreakdown,
      dailyBreakdown,
    };
  }

  /**
   * Get user-specific analytics
   */
  async getUserAnalytics(userId: string, period?: AnalyticsPeriod): Promise<{
    totalTransactions: number;
    totalVolume: string;
    transactionsByType: Record<string, number>;
    successRate: number;
    averageFee: number;
  }> {
    const { start, end } = this.calculateDateRange(period);

    const transactions = await this.transactionRepository.find({
      where: {
        userId,
        createdAt: Between(start, end),
      },
    });

    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(
      tx => tx.status === TransactionStatus.CONFIRMED
    ).length;

    const totalVolume = transactions
      .filter(tx => tx.status === TransactionStatus.CONFIRMED && tx.assetCode === 'XLM')
      .reduce((sum, tx) => sum + (parseFloat(tx.amount || '0') || 0), 0)
      .toFixed(7);

    const transactionsByType = this.groupByField(transactions, 'type');

    const successRate = totalTransactions > 0
      ? Math.round((successfulTransactions / totalTransactions) * 10000) / 100
      : 0;

    const averageFee = transactions.length > 0
      ? Math.round(
          transactions.reduce((sum, tx) => sum + (tx.feeCharged || 0), 0) / transactions.length
        )
      : 0;

    return {
      totalTransactions,
      totalVolume,
      transactionsByType,
      successRate,
      averageFee,
    };
  }

  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(): Promise<{
    transactionsLast24h: number;
    transactionsLastHour: number;
    pendingTransactions: number;
    failedTransactionsLast24h: number;
    averageConfirmationTime: number;
    totalVolume24h: string;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const transactions24h = await this.transactionRepository.find({
      where: { createdAt: Between(last24h, now) },
    });

    const transactionsLast24h = transactions24h.length;
    const transactionsLastHour = transactions24h.filter(
      tx => tx.createdAt >= lastHour
    ).length;

    const pendingTransactions = (await this.transactionRepository.find({
      where: [
        { status: TransactionStatus.PENDING },
        { status: TransactionStatus.PROCESSING },
      ],
    })).length;

    const failedTransactionsLast24h = transactions24h.filter(
      tx => tx.status === TransactionStatus.FAILED
    ).length;

    const confirmedTxs = transactions24h.filter(
      tx => tx.status === TransactionStatus.CONFIRMED && tx.confirmedAt && tx.createdAt
    );

    const averageConfirmationTime = confirmedTxs.length > 0
      ? Math.round(
          confirmedTxs.reduce((sum, tx) => {
            const confirmationTime = tx.confirmedAt!.getTime() - tx.createdAt.getTime();
            return sum + confirmationTime;
          }, 0) / confirmedTxs.length / 1000 // Convert to seconds
        )
      : 0;

    const totalVolume24h = transactions24h
      .filter(tx => tx.status === TransactionStatus.CONFIRMED && tx.assetCode === 'XLM')
      .reduce((sum, tx) => sum + (parseFloat(tx.amount || '0') || 0), 0)
      .toFixed(7);

    return {
      transactionsLast24h,
      transactionsLastHour,
      pendingTransactions,
      failedTransactionsLast24h,
      averageConfirmationTime,
      totalVolume24h,
    };
  }

  /**
   * Get transaction type distribution
   */
  async getTypeDistribution(days: number = 30): Promise<{
    type: TransactionType;
    count: number;
    percentage: number;
  }[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const transactions = await this.transactionRepository.find({
      where: { createdAt: Between(startDate, new Date()) },
    });

    const total = transactions.length;
    const byType = this.groupByField(transactions, 'type');

    return Object.entries(byType)
      .map(([type, count]) => ({
        type: type as TransactionType,
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate date range from period or explicit dates
   */
  private calculateDateRange(
    period?: AnalyticsPeriod,
    startDate?: string,
    endDate?: string
  ): { start: Date; end: Date } {
    if (startDate && endDate) {
      return {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const end = new Date();
    let start: Date;

    switch (period) {
      case AnalyticsPeriod.HOUR:
        start = new Date(end.getTime() - 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.WEEK:
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.MONTH:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.YEAR:
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.DAY:
      default:
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    return { start, end };
  }

  /**
   * Group transactions by a field
   */
  private groupByField(
    transactions: BlockchainTransaction[],
    field: keyof BlockchainTransaction
  ): Record<string, number> {
    return transactions.reduce((acc, tx) => {
      const key = String(tx[field] || 'unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Build hourly breakdown
   */
  private buildHourlyBreakdown(
    transactions: BlockchainTransaction[]
  ): { hour: string; count: number; volume: string }[] {
    const hourly: Record<string, { count: number; volume: number }> = {};

    for (const tx of transactions) {
      const hour = tx.createdAt.toISOString().slice(0, 13) + ':00:00.000Z';
      
      if (!hourly[hour]) {
        hourly[hour] = { count: 0, volume: 0 };
      }

      hourly[hour].count++;
      
      if (tx.status === TransactionStatus.CONFIRMED && tx.assetCode === 'XLM') {
        hourly[hour].volume += parseFloat(tx.amount || '0') || 0;
      }
    }

    return Object.entries(hourly)
      .map(([hour, data]) => ({
        hour,
        count: data.count,
        volume: data.volume.toFixed(7),
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  /**
   * Build daily breakdown
   */
  private buildDailyBreakdown(
    transactions: BlockchainTransaction[]
  ): { date: string; count: number; volume: string }[] {
    const daily: Record<string, { count: number; volume: number }> = {};

    for (const tx of transactions) {
      const date = tx.createdAt.toISOString().slice(0, 10);
      
      if (!daily[date]) {
        daily[date] = { count: 0, volume: 0 };
      }

      daily[date].count++;
      
      if (tx.status === TransactionStatus.CONFIRMED && tx.assetCode === 'XLM') {
        daily[date].volume += parseFloat(tx.amount || '0') || 0;
      }
    }

    return Object.entries(daily)
      .map(([date, data]) => ({
        date,
        count: data.count,
        volume: data.volume.toFixed(7),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
