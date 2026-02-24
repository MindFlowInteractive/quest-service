import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import {
  BlockchainTransaction,
  TransactionStatus,
} from './entities/blockchain-transaction.entity';
import { TransactionQueryDto } from './dto';
import { HorizonApiService } from './services/horizon-api.service';
import { TransactionParserService } from './services/transaction-parser.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class BlockchainTransactionService {
  private readonly logger = new Logger(BlockchainTransactionService.name);

  constructor(
    @InjectRepository(BlockchainTransaction)
    private transactionRepository: Repository<BlockchainTransaction>,
    private horizonApiService: HorizonApiService,
    private transactionParserService: TransactionParserService,
  ) {}

  /**
   * Create a new transaction record
   */
  async create(createDto: CreateTransactionDto): Promise<BlockchainTransaction> {
    const transaction = this.transactionRepository.create({
      ...createDto,
      status: TransactionStatus.PENDING,
    });

    return this.transactionRepository.save(transaction);
  }

  /**
   * Find all transactions with filtering and pagination
   */
  async findAll(query: TransactionQueryDto): Promise<{
    data: BlockchainTransaction[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const where: FindOptionsWhere<BlockchainTransaction> = {};

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.userId) where.userId = query.userId;
    if (query.sourceAccount) where.sourceAccount = query.sourceAccount;
    if (query.destinationAccount) where.destinationAccount = query.destinationAccount;
    if (query.transactionHash) where.transactionHash = query.transactionHash;

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    const [data, total] = await this.transactionRepository.findAndCount({
      where,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    return {
      data,
      total,
      limit: query.limit || 20,
      offset: query.offset || 0,
    };
  }

  /**
   * Find transaction by hash
   */
  async findByHash(hash: string): Promise<BlockchainTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionHash: hash },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with hash ${hash} not found`);
    }

    return transaction;
  }

  /**
   * Find transactions by user ID
   */
  async findByUser(
    userId: string,
    query: TransactionQueryDto
  ): Promise<{
    data: BlockchainTransaction[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const where: FindOptionsWhere<BlockchainTransaction> = { userId };

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    const [data, total] = await this.transactionRepository.findAndCount({
      where,
      order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' },
      take: query.limit,
      skip: query.offset,
    });

    return {
      data,
      total,
      limit: query.limit || 20,
      offset: query.offset || 0,
    };
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    hash: string,
    status: TransactionStatus,
    updates?: Partial<BlockchainTransaction>
  ): Promise<BlockchainTransaction> {
    const transaction = await this.findByHash(hash);
    
    transaction.status = status;
    
    if (updates) {
      Object.assign(transaction, updates);
    }

    if (status === TransactionStatus.CONFIRMED) {
      transaction.confirmedAt = new Date();
    } else if (status === TransactionStatus.FAILED) {
      transaction.failedAt = new Date();
    }

    return this.transactionRepository.save(transaction);
  }

  /**
   * Sync transactions for a Stellar account
   */
  async syncAccountTransactions(accountId: string): Promise<{ count: number }> {
    this.logger.log(`Syncing transactions for account ${accountId}`);

    let cursor: string | undefined;
    let hasMore = true;
    let totalSynced = 0;

    while (hasMore && totalSynced < 200) { // Limit to prevent infinite loops
      try {
        const response = await this.horizonApiService.getAccountTransactions(accountId, {
          cursor,
          limit: 50,
          order: 'desc',
        });

        const transactions = response._embedded.records;

        if (transactions.length === 0) {
          hasMore = false;
          break;
        }

        for (const horizonTx of transactions) {
          // Check if transaction already exists
          const existing = await this.transactionRepository.findOne({
            where: { transactionHash: horizonTx.hash },
          });

          if (existing) {
            // Update if status changed
            const newStatus = horizonTx.successful
              ? TransactionStatus.CONFIRMED
              : TransactionStatus.FAILED;
            
            if (existing.status !== newStatus) {
              await this.updateStatus(horizonTx.hash, newStatus, {
                ledgerSequence: horizonTx.ledger,
              });
            }
            continue;
          }

          // Fetch operations for the transaction
          const operationsResponse = await this.horizonApiService.getTransactionOperations(
            horizonTx.hash
          );
          const operations = operationsResponse._embedded.records;

          // Parse and save transaction
          let transaction = this.transactionParserService.parseTransaction(horizonTx);
          transaction = this.transactionParserService.parseOperations(operations, transaction);
          transaction.category = this.transactionParserService.categorizeTransaction(
            transaction,
            operations
          );
          transaction.userId = this.transactionParserService.extractUserId(transaction);

          await this.transactionRepository.save(transaction);
          totalSynced++;
        }

        // Get next cursor
        const nextLink = response._links.next?.href;
        if (nextLink) {
          const url = new URL(nextLink);
          cursor = url.searchParams.get('cursor') || undefined;
        } else {
          hasMore = false;
        }
      } catch (error) {
        this.logger.error(`Error syncing transactions for account ${accountId}:`, error);
        break;
      }
    }

    this.logger.log(`Synced ${totalSynced} transactions for account ${accountId}`);
    return { count: totalSynced };
  }

  /**
   * Get transaction count by status
   */
  async getCountByStatus(): Promise<Record<TransactionStatus, number>> {
    const counts = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('tx.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tx.status')
      .getRawMany();

    return counts.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {} as Record<TransactionStatus, number>);
  }

  /**
   * Delete old transactions (for cleanup)
   */
  async deleteOldTransactions(beforeDate: Date): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :beforeDate', { beforeDate })
      .andWhere('status IN (:...statuses)', {
        statuses: [TransactionStatus.CONFIRMED, TransactionStatus.CANCELLED],
      })
      .execute();

    return result.affected || 0;
  }
}
