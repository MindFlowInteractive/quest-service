import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BlockchainTransaction,
  TransactionStatus,
} from '../entities/blockchain-transaction.entity';
import { HorizonApiService } from './horizon-api.service';

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

@Injectable()
export class TransactionRetryService {
  private readonly logger = new Logger(TransactionRetryService.name);
  private readonly retryConfig: RetryConfig;

  constructor(
    @InjectRepository(BlockchainTransaction)
    private transactionRepository: Repository<BlockchainTransaction>,
    private horizonApiService: HorizonApiService,
    private eventEmitter: EventEmitter2,
  ) {
    this.retryConfig = {
      maxRetries: parseInt(process.env.TX_MAX_RETRIES || '3', 10),
      initialDelayMs: parseInt(process.env.TX_RETRY_INITIAL_DELAY_MS || '5000', 10),
      maxDelayMs: parseInt(process.env.TX_RETRY_MAX_DELAY_MS || '300000', 10),
      backoffMultiplier: parseFloat(process.env.TX_RETRY_BACKOFF_MULTIPLIER || '2'),
    };
  }

  /**
   * Cron job: Process failed transactions for retry
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async processFailedTransactions(): Promise<void> {
    this.logger.log('Processing failed transactions for retry...');

    try {
      const now = new Date();
      
      // Find failed transactions that are ready for retry
      const failedTxs = await this.transactionRepository.find({
        where: {
          status: TransactionStatus.FAILED,
          retryCount: LessThan(this.retryConfig.maxRetries),
          nextRetryAt: LessThan(now),
        },
      });

      this.logger.log(`Found ${failedTxs.length} failed transactions to retry`);

      for (const tx of failedTxs) {
        await this.retryTransaction(tx);
      }
    } catch (error) {
      this.logger.error('Error processing failed transactions:', error);
    }
  }

  /**
   * Retry a specific transaction
   */
  async retryTransaction(transaction: BlockchainTransaction): Promise<void> {
    try {
      this.logger.log(`Retrying transaction ${transaction.transactionHash} (attempt ${transaction.retryCount + 1})`);

      // Update status to retrying
      transaction.status = TransactionStatus.RETRYING;
      await this.transactionRepository.save(transaction);

      // Emit retry event
      this.eventEmitter.emit('blockchain.transaction.retry', {
        transactionHash: transaction.transactionHash,
        userId: transaction.userId,
        retryCount: transaction.retryCount,
        timestamp: new Date(),
      });

      // Check transaction status on the network
      const horizonTx = await this.horizonApiService.getTransaction(transaction.transactionHash);

      if (horizonTx) {
        // Transaction exists on network - update status accordingly
        if (horizonTx.successful) {
          transaction.status = TransactionStatus.CONFIRMED;
          transaction.confirmedAt = new Date(horizonTx.created_at);
          transaction.ledgerSequence = horizonTx.ledger;
          transaction.lastError = null;
          
          this.logger.log(`Transaction ${transaction.transactionHash} confirmed on retry`);
        } else {
          // Transaction failed on network
          transaction.retryCount++;
          
          if (transaction.retryCount >= this.retryConfig.maxRetries) {
            transaction.status = TransactionStatus.FAILED;
            transaction.lastError = 'Transaction failed on network after max retries';
            transaction.failedAt = new Date();
            
            this.logger.warn(`Transaction ${transaction.transactionHash} failed after max retries`);
            
            // Emit failure notification
            this.emitFailureNotification(transaction);
          } else {
            // Schedule next retry
            transaction.status = TransactionStatus.FAILED;
            transaction.nextRetryAt = this.calculateNextRetryTime(transaction.retryCount);
            transaction.lastError = `Transaction failed on network, will retry (${transaction.retryCount}/${this.retryConfig.maxRetries})`;
          }
        }
      } else {
        // Transaction not found on network - might not have been submitted
        transaction.retryCount++;
        
        if (transaction.retryCount >= this.retryConfig.maxRetries) {
          transaction.status = TransactionStatus.FAILED;
          transaction.lastError = 'Transaction not found on network after max retries';
          transaction.failedAt = new Date();
          
          this.logger.warn(`Transaction ${transaction.transactionHash} not found after max retries`);
          
          this.emitFailureNotification(transaction);
        } else {
          transaction.status = TransactionStatus.FAILED;
          transaction.nextRetryAt = this.calculateNextRetryTime(transaction.retryCount);
          transaction.lastError = `Transaction not found on network, will retry (${transaction.retryCount}/${this.retryConfig.maxRetries})`;
        }
      }

      await this.transactionRepository.save(transaction);

    } catch (error) {
      this.logger.error(`Error retrying transaction ${transaction.transactionHash}:`, error);
      
      // Update transaction with error
      transaction.retryCount++;
      transaction.lastError = `Retry error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      if (transaction.retryCount >= this.retryConfig.maxRetries) {
        transaction.status = TransactionStatus.FAILED;
        transaction.failedAt = new Date();
        this.emitFailureNotification(transaction);
      } else {
        transaction.status = TransactionStatus.FAILED;
        transaction.nextRetryAt = this.calculateNextRetryTime(transaction.retryCount);
      }
      
      await this.transactionRepository.save(transaction);
    }
  }

  /**
   * Manually retry a transaction by hash
   */
  async manualRetry(transactionHash: string): Promise<BlockchainTransaction | null> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionHash },
    });

    if (!transaction) {
      this.logger.warn(`Transaction ${transactionHash} not found for manual retry`);
      return null;
    }

    if (transaction.status !== TransactionStatus.FAILED && 
        transaction.status !== TransactionStatus.CANCELLED) {
      this.logger.warn(`Transaction ${transactionHash} cannot be retried (status: ${transaction.status})`);
      return transaction;
    }

    // Reset retry count for manual retry
    transaction.retryCount = 0;
    transaction.nextRetryAt = new Date();
    transaction.lastError = null;
    
    await this.transactionRepository.save(transaction);
    await this.retryTransaction(transaction);
    
    return transaction;
  }

  /**
   * Cancel a transaction (stop retrying)
   */
  async cancelTransaction(transactionHash: string): Promise<BlockchainTransaction | null> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionHash },
    });

    if (!transaction) {
      this.logger.warn(`Transaction ${transactionHash} not found for cancellation`);
      return null;
    }

    if (transaction.status === TransactionStatus.CONFIRMED) {
      this.logger.warn(`Cannot cancel confirmed transaction ${transactionHash}`);
      return transaction;
    }

    transaction.status = TransactionStatus.CANCELLED;
    transaction.lastError = 'Transaction cancelled by user/system';
    transaction.cancelledAt = new Date();
    
    await this.transactionRepository.save(transaction);
    
    this.logger.log(`Transaction ${transactionHash} cancelled`);
    
    return transaction;
  }

  /**
   * Calculate next retry time with exponential backoff
   */
  private calculateNextRetryTime(retryCount: number): Date {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount),
      this.retryConfig.maxDelayMs
    );
    
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    const finalDelay = delay + jitter;
    
    return new Date(Date.now() + finalDelay);
  }

  /**
   * Emit failure notification
   */
  private emitFailureNotification(transaction: BlockchainTransaction): void {
    this.eventEmitter.emit('blockchain.transaction.failed_permanently', {
      transactionHash: transaction.transactionHash,
      userId: transaction.userId,
      type: transaction.type,
      category: transaction.category,
      error: transaction.lastError,
      timestamp: new Date(),
    });
  }

  /**
   * Get retry statistics
   */
  async getRetryStats(): Promise<{
    totalFailed: number;
    pendingRetry: number;
    maxRetriesReached: number;
    averageRetryCount: number;
  }> {
    const failedTxs = await this.transactionRepository.find({
      where: { status: TransactionStatus.FAILED },
    });

    const pendingRetry = failedTxs.filter(
      tx => tx.retryCount < this.retryConfig.maxRetries
    ).length;

    const maxRetriesReached = failedTxs.filter(
      tx => tx.retryCount >= this.retryConfig.maxRetries
    ).length;

    const averageRetryCount = failedTxs.length > 0
      ? failedTxs.reduce((sum, tx) => sum + tx.retryCount, 0) / failedTxs.length
      : 0;

    return {
      totalFailed: failedTxs.length,
      pendingRetry,
      maxRetriesReached,
      averageRetryCount: Math.round(averageRetryCount * 100) / 100,
    };
  }
}
