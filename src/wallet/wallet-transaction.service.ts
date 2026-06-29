import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { WalletTransaction, WalletTransactionType } from './entities/wallet-transaction.entity';

export interface TransactionFilter {
  type?: WalletTransactionType;
  token?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TransactionSummary {
  token: string;
  totalReceived: string;
  totalSpent: string;
  netBalance: string;
}

@Injectable()
export class WalletTransactionService {
  private readonly logger = new Logger(WalletTransactionService.name);

  constructor(
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
  ) {}

  async createTransaction(data: {
    walletAddress: string;
    txHash: string;
    type: WalletTransactionType;
    amount: string;
    token: string;
    counterparty?: string;
    ledger: number;
  }): Promise<WalletTransaction> {
    const transaction = this.transactionRepo.create(data);
    return this.transactionRepo.save(transaction);
  }

  async findByTxHash(txHash: string): Promise<WalletTransaction | null> {
    return this.transactionRepo.findOne({ where: { txHash } });
  }

  async getTransactions(
    walletAddress: string,
    filter: TransactionFilter = {},
    page = 1,
    limit = 20,
  ): Promise<{ transactions: WalletTransaction[]; total: number }> {
    const query = this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.walletAddress = :walletAddress', { walletAddress })
      .orderBy('transaction.createdAt', 'DESC');

    if (filter.type) {
      query.andWhere('transaction.type = :type', { type: filter.type });
    }

    if (filter.token) {
      query.andWhere('transaction.token = :token', { token: filter.token });
    }

    if (filter.dateFrom || filter.dateTo) {
      const dateFilter: any = {};
      if (filter.dateFrom) dateFilter.gte = filter.dateFrom;
      if (filter.dateTo) dateFilter.lte = filter.dateTo;
      query.andWhere('transaction.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filter.dateFrom || new Date(0),
        dateTo: filter.dateTo || new Date(),
      });
    }

    const [transactions, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { transactions, total };
  }

  async getTransactionSummary(
    walletAddress: string,
    days = 30,
  ): Promise<TransactionSummary[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const transactions = await this.transactionRepo.find({
      where: {
        walletAddress,
        createdAt: MoreThanOrEqual(since),
      },
    });

    const summaryMap = new Map<string, { received: number; spent: number }>();

    for (const tx of transactions) {
      const amount = parseFloat(tx.amount);
      if (!summaryMap.has(tx.token)) {
        summaryMap.set(tx.token, { received: 0, spent: 0 });
      }
      const tokenSummary = summaryMap.get(tx.token)!;

      // For rewards, purchases, stakes: received
      // For unstakes, swaps: depends on direction, but simplify
      if (['reward', 'purchase', 'stake'].includes(tx.type)) {
        tokenSummary.received += amount;
      } else {
        tokenSummary.spent += amount;
      }
    }

    return Array.from(summaryMap.entries()).map(([token, sums]) => ({
      token,
      totalReceived: sums.received.toFixed(7),
      totalSpent: sums.spent.toFixed(7),
      netBalance: (sums.received - sums.spent).toFixed(7),
    }));
  }

  async syncTransactionsFromHorizon(
    walletAddress: string,
    horizonTransactions: any[],
  ): Promise<void> {
    for (const horizonTx of horizonTransactions) {
      const txHash = horizonTx.transaction_hash;
      const existing = await this.findByTxHash(txHash);
      if (existing) continue;

      // Parse the transaction to determine type, amount, etc.
      const parsed = this.parseHorizonTransaction(walletAddress, horizonTx);
      if (parsed) {
        try {
          await this.createTransaction(parsed);
          this.logger.log(`Synced transaction ${txHash} for wallet ${walletAddress}`);
        } catch (error) {
          this.logger.error(`Failed to sync transaction ${txHash}:`, error);
        }
      }
    }
  }

  private parseHorizonTransaction(
    walletAddress: string,
    horizonTx: any,
  ): {
    walletAddress: string;
    txHash: string;
    type: WalletTransactionType;
    amount: string;
    token: string;
    counterparty?: string;
    ledger: number;
  } | null {
    const operations = horizonTx._embedded?.records || [];
    const ledger = horizonTx.ledger;

    // For simplicity, process the first operation
    // In a real implementation, you'd process all operations in the transaction
    const operation = operations[0];
    if (!operation) return null;

    const txHash = operation.transaction_hash;
    let type: WalletTransactionType;
    let amount: string;
    let token: string;
    let counterparty: string | undefined;

    if (operation.type === 'payment' || operation.type?.startsWith('path_payment')) {
      amount = operation.amount;
      token = operation.asset_type === 'native' ? 'XLM' : operation.asset_code;
      counterparty = operation.from === walletAddress ? operation.to : operation.from;

      // Determine type based on context - this is simplified
      // In reality, you'd need more logic to determine if it's reward, purchase, etc.
      type = 'purchase'; // Default assumption
    } else if (operation.type === 'create_account') {
      amount = operation.starting_balance;
      token = 'XLM';
      counterparty = operation.funder;
      type = 'reward'; // Account creation could be considered a reward
    } else {
      return null; // Unsupported operation type
    }

    return {
      walletAddress,
      txHash,
      type,
      amount,
      token,
      counterparty,
      ledger,
    };
  }
}