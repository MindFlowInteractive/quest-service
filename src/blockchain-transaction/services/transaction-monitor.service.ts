import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BlockchainTransaction,
  TransactionStatus,
} from '../entities/blockchain-transaction.entity';
import { HorizonApiService } from './horizon-api.service';
import { TransactionParserService } from './transaction-parser.service';
import { TransactionEvent, TransactionAlert } from '../interfaces/transaction-event.interface';

@Injectable()
export class TransactionMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TransactionMonitorService.name);
  private streamingController: { stop: () => void } | null = null;
  private isMonitoring = false;

  constructor(
    @InjectRepository(BlockchainTransaction)
    private transactionRepository: Repository<BlockchainTransaction>,
    private horizonApiService: HorizonApiService,
    private transactionParserService: TransactionParserService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing transaction monitor service...');
    // Start monitoring on module init if enabled
    const enableStreaming = process.env.ENABLE_TX_STREAMING === 'true';
    if (enableStreaming) {
      this.startRealTimeMonitoring();
    }
  }

  onModuleDestroy() {
    this.logger.log('Destroying transaction monitor service...');
    this.stopRealTimeMonitoring();
  }

  /**
   * Start real-time transaction monitoring via SSE streaming
   */
  startRealTimeMonitoring(): void {
    if (this.isMonitoring) {
      this.logger.warn('Transaction monitoring is already running');
      return;
    }

    this.logger.log('Starting real-time transaction monitoring...');
    this.isMonitoring = true;

    // Get the latest cursor for streaming
    this.getLatestCursor().then((cursor) => {
      this.streamingController = this.horizonApiService.streamTransactions({
        cursor,
        onTransaction: (tx) => this.handleNewTransaction(tx),
        onError: (error) => this.handleStreamingError(error),
      });
    });
  }

  /**
   * Stop real-time transaction monitoring
   */
  stopRealTimeMonitoring(): void {
    if (this.streamingController) {
      this.streamingController.stop();
      this.streamingController = null;
    }
    this.isMonitoring = false;
    this.logger.log('Stopped real-time transaction monitoring');
  }

  /**
   * Get the latest cursor for streaming
   */
  private async getLatestCursor(): Promise<string | undefined> {
    try {
      const latestTx = await this.transactionRepository.findOne({
        where: {},
        order: { ledgerSequence: 'DESC' },
      });
      return latestTx?.pagingToken;
    } catch (error) {
      this.logger.error('Error getting latest cursor:', error);
      return undefined;
    }
  }

  /**
   * Handle new transaction from stream
   */
  private async handleNewTransaction(horizonTx: any): Promise<void> {
    try {
      // Check if transaction already exists
      const existingTx = await this.transactionRepository.findOne({
        where: { transactionHash: horizonTx.hash },
      });

      if (existingTx) {
        // Update existing transaction status
        await this.updateTransactionStatus(existingTx, horizonTx);
        return;
      }

      // Parse and save new transaction
      await this.processNewTransaction(horizonTx);
    } catch (error) {
      this.logger.error(`Error handling transaction ${horizonTx.hash}:`, error);
    }
  }

  /**
   * Process a new transaction
   */
  private async processNewTransaction(horizonTx: any): Promise<void> {
    try {
      // Fetch operations for the transaction
      const operationsResponse = await this.horizonApiService.getTransactionOperations(horizonTx.hash);
      const operations = operationsResponse._embedded.records;

      // Parse transaction
      let transaction = this.transactionParserService.parseTransaction(horizonTx);
      transaction = this.transactionParserService.parseOperations(operations, transaction);
      
      // Categorize and extract user ID
      transaction.category = this.transactionParserService.categorizeTransaction(transaction, operations);
      transaction.userId = this.transactionParserService.extractUserId(transaction) || transaction.userId;

      // Save transaction
      const savedTx = await this.transactionRepository.save(transaction);
      
      this.logger.log(`New transaction saved: ${savedTx.transactionHash} (${savedTx.type})`);

      // Emit event
      this.emitTransactionEvent('transaction_created', savedTx);

      // Check for large transactions and alert
      if (this.isLargeTransaction(savedTx)) {
        this.emitAlert({
          alertType: 'large_transaction',
          severity: 'medium',
          message: `Large transaction detected: ${savedTx.amount} ${savedTx.assetCode}`,
          transactionHash: savedTx.transactionHash,
          userId: savedTx.userId,
          timestamp: new Date(),
          metadata: { amount: savedTx.amount, assetCode: savedTx.assetCode },
        });
      }
    } catch (error) {
      this.logger.error(`Error processing transaction ${horizonTx.hash}:`, error);
    }
  }

  /**
   * Update existing transaction status
   */
  private async updateTransactionStatus(
    existingTx: BlockchainTransaction,
    horizonTx: any
  ): Promise<void> {
    const newStatus = horizonTx.successful ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED;
    
    if (existingTx.status !== newStatus) {
      existingTx.status = newStatus;
      existingTx.ledgerSequence = horizonTx.ledger;
      
      if (newStatus === TransactionStatus.CONFIRMED) {
        existingTx.confirmedAt = new Date(horizonTx.created_at);
      } else {
        existingTx.failedAt = new Date(horizonTx.created_at);
      }

      await this.transactionRepository.save(existingTx);
      
      this.logger.log(`Transaction ${existingTx.transactionHash} status updated to ${newStatus}`);

      // Emit appropriate event
      const eventType = newStatus === TransactionStatus.CONFIRMED 
        ? 'transaction_confirmed' 
        : 'transaction_failed';
      this.emitTransactionEvent(eventType, existingTx);
    }
  }

  /**
   * Handle streaming errors
   */
  private handleStreamingError(error: Error): void {
    this.logger.error('Transaction streaming error:', error);
    
    this.emitAlert({
      alertType: 'network_issue',
      severity: 'high',
      message: `Transaction streaming error: ${error.message}`,
      timestamp: new Date(),
      metadata: { error: error.message },
    });

    // Attempt to restart streaming after a delay
    setTimeout(() => {
      if (this.isMonitoring) {
        this.logger.log('Attempting to restart transaction streaming...');
        this.stopRealTimeMonitoring();
        this.startRealTimeMonitoring();
      }
    }, 30000);
  }

  /**
   * Cron job: Monitor pending transactions
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorPendingTransactions(): Promise<void> {
    this.logger.log('Running pending transaction check...');

    try {
      const pendingTxs = await this.transactionRepository.find({
        where: [
          { status: TransactionStatus.PENDING },
          { status: TransactionStatus.PROCESSING },
        ],
      });

      this.logger.log(`Found ${pendingTxs.length} pending transactions to check`);

      for (const tx of pendingTxs) {
        try {
          const horizonTx = await this.horizonApiService.getTransaction(tx.transactionHash);
          
          if (horizonTx) {
            await this.updateTransactionStatus(tx, horizonTx);
          } else {
            // Transaction not found on network - might be stuck
            this.logger.warn(`Transaction ${tx.transactionHash} not found on network`);
            
            // Check if it's been pending too long
            const pendingTime = Date.now() - tx.createdAt.getTime();
            const maxPendingTime = 30 * 60 * 1000; // 30 minutes
            
            if (pendingTime > maxPendingTime) {
              this.emitAlert({
                alertType: 'transaction_stuck',
                severity: 'medium',
                message: `Transaction stuck for ${Math.round(pendingTime / 60000)} minutes`,
                transactionHash: tx.transactionHash,
                userId: tx.userId,
                timestamp: new Date(),
              });
            }
          }
        } catch (error) {
          this.logger.error(`Error checking transaction ${tx.transactionHash}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error monitoring pending transactions:', error);
    }
  }

  /**
   * Cron job: Check for high failure rates
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkFailureRates(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentTxs = await this.transactionRepository.find({
        where: {
          createdAt: LessThan(oneHourAgo),
        },
      });

      const failedCount = recentTxs.filter(tx => tx.status === TransactionStatus.FAILED).length;
      const failureRate = recentTxs.length > 0 ? failedCount / recentTxs.length : 0;

      if (failureRate > 0.1) { // More than 10% failure rate
        this.emitAlert({
          alertType: 'high_failure_rate',
          severity: failureRate > 0.25 ? 'critical' : 'high',
          message: `High transaction failure rate detected: ${(failureRate * 100).toFixed(1)}%`,
          timestamp: new Date(),
          metadata: {
            failureRate,
            totalTransactions: recentTxs.length,
            failedTransactions: failedCount,
          },
        });
      }
    } catch (error) {
      this.logger.error('Error checking failure rates:', error);
    }
  }

  /**
   * Check if transaction is large (alert threshold)
   */
  private isLargeTransaction(tx: BlockchainTransaction): boolean {
    if (!tx.amount || tx.assetCode !== 'XLM') return false;
    
    const amount = parseFloat(tx.amount);
    const threshold = 10000; // 10,000 XLM threshold
    return amount >= threshold;
  }

  /**
   * Emit transaction event
   */
  private emitTransactionEvent(
    eventType: TransactionEvent['eventType'],
    transaction: BlockchainTransaction
  ): void {
    const event: TransactionEvent = {
      eventType,
      transactionHash: transaction.transactionHash,
      userId: transaction.userId,
      status: transaction.status,
      type: transaction.type,
      category: transaction.category,
      timestamp: new Date(),
      data: {
        sourceAccount: transaction.sourceAccount,
        destinationAccount: transaction.destinationAccount,
        amount: transaction.amount,
        assetCode: transaction.assetCode,
        ledgerSequence: transaction.ledgerSequence,
        feeCharged: transaction.feeCharged,
        errorMessage: transaction.lastError,
        retryCount: transaction.retryCount,
      },
    };

    this.eventEmitter.emit('blockchain.transaction', event);
  }

  /**
   * Emit alert
   */
  private emitAlert(alert: TransactionAlert): void {
    this.eventEmitter.emit('blockchain.alert', alert);
    this.logger.warn(`Alert: ${alert.alertType} - ${alert.message}`);
  }

  /**
   * Get monitoring status
   */
  getStatus(): { isMonitoring: boolean; streamingActive: boolean } {
    return {
      isMonitoring: this.isMonitoring,
      streamingActive: this.streamingController !== null,
    };
  }
}
