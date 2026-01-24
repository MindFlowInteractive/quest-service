import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  CurrencyType,
} from './transaction.entity';

export class CreateTransactionDto {
  userId: string;
  type: TransactionType;
  currency: CurrencyType;
  amount: number;
  description?: string;
  referenceId?: string;
  shopItemId?: string;
  metadata?: Record<string, any>;
  externalTransactionId?: string;
}

export class UpdateTransactionStatusDto {
  status: TransactionStatus;
  failureReason?: string;
  externalTransactionId?: string;
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create(createTransactionDto);
    return this.transactionRepository.save(transaction);
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async getUserTransactions(
    userId: string,
    options: {
      type?: TransactionType;
      status?: TransactionStatus;
      currency?: CurrencyType;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<Transaction[]> {
    const { type, status, currency, limit = 50, offset = 0 } = options;

    const whereClause: any = { userId };
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (currency) whereClause.currency = currency;

    return this.transactionRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async updateTransactionStatus(
    id: string,
    updateTransactionStatusDto: UpdateTransactionStatusDto,
  ): Promise<Transaction> {
    const transaction = await this.getTransactionById(id);

    Object.assign(transaction, updateTransactionStatusDto);

    if (updateTransactionStatusDto.status === TransactionStatus.COMPLETED) {
      transaction.completedAt = new Date();
    } else if (updateTransactionStatusDto.status === TransactionStatus.FAILED) {
      transaction.failedAt = new Date();
    }

    return this.transactionRepository.save(transaction);
  }

  async completeTransaction(
    id: string,
    externalTransactionId?: string,
  ): Promise<Transaction> {
    return this.updateTransactionStatus(id, {
      status: TransactionStatus.COMPLETED,
      externalTransactionId,
    });
  }

  async failTransaction(
    id: string,
    failureReason: string,
  ): Promise<Transaction> {
    return this.updateTransactionStatus(id, {
      status: TransactionStatus.FAILED,
      failureReason,
    });
  }

  async refundTransaction(id: string): Promise<Transaction> {
    const originalTransaction = await this.getTransactionById(id);

    if (originalTransaction.status !== TransactionStatus.COMPLETED) {
      throw new Error('Cannot refund a transaction that was not completed');
    }

    const refundTransaction = this.createTransaction({
      userId: originalTransaction.userId,
      type: TransactionType.REFUND,
      currency: originalTransaction.currency,
      amount: originalTransaction.amount,
      description: `Refund for transaction ${id}`,
      referenceId: id,
      metadata: originalTransaction.metadata,
    });

    await this.updateTransactionStatus(id, {
      status: TransactionStatus.REFUNDED,
    });

    return refundTransaction;
  }

  async getUserBalance(
    userId: string,
    currency: CurrencyType,
  ): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(
        'SUM(CASE WHEN transaction.status = :completed THEN transaction.amount ELSE 0 END)',
        'total',
      )
      .addSelect(
        'SUM(CASE WHEN transaction.status = :completed AND transaction.type = :refund THEN transaction.amount ELSE 0 END)',
        'refunds',
      )
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.currency = :currency', { currency })
      .setParameter('completed', TransactionStatus.COMPLETED)
      .setParameter('refund', TransactionType.REFUND)
      .getRawOne();

    const total = parseFloat(result.total) || 0;
    const refunds = parseFloat(result.refunds) || 0;

    return total - refunds;
  }

  async getTransactionHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Transaction[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId });

    if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    return queryBuilder.orderBy('transaction.createdAt', 'DESC').getMany();
  }

  async createPurchaseTransaction(
    userId: string,
    shopItemId: string,
    amount: number,
    currency: CurrencyType,
    description?: string,
  ): Promise<Transaction> {
    return this.createTransaction({
      userId,
      type: TransactionType.PURCHASE,
      currency,
      amount,
      description: description || `Purchase of shop item ${shopItemId}`,
      shopItemId,
    });
  }

  async createEnergyRefillTransaction(
    userId: string,
    amount: number,
    currency: CurrencyType,
    description?: string,
  ): Promise<Transaction> {
    return this.createTransaction({
      userId,
      type: TransactionType.REFILL,
      currency,
      amount,
      description: description || 'Energy refill',
    });
  }

  async createBonusTransaction(
    userId: string,
    amount: number,
    currency: CurrencyType,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<Transaction> {
    return this.createTransaction({
      userId,
      type: TransactionType.BONUS,
      currency,
      amount,
      description: description || 'Bonus reward',
      metadata,
    });
  }
}
