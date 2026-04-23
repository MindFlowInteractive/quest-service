import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { StellarService } from './stellar.service';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * TransactionMonitoringService
 *
 * Monitors pending/processing blockchain transactions and updates reward status.
 * Runs on a 5-minute cron schedule to check transaction confirmations.
 *
 * Responsibilities:
 *  - Poll pending transactions for blockchain confirmation
 *  - Update reward status based on transaction result
 *  - Retry failed transactions
 *  - Maintain audit trail of transaction attempts
 */
@Injectable()
export class TransactionMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(TransactionMonitoringService.name);

  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    private readonly stellarService: StellarService,
  ) {}

  async onModuleInit() {
    this.logger.log('TransactionMonitoringService initialized');
  }

  // ─── Monitoring ───────────────────────────────────────────────────────────────
  /**
   * Poll all pending/processing rewards and check their blockchain status.
   * Runs every 5 minutes via @Cron decorator.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorPendingTransactions() {
    this.logger.debug('Starting transaction monitoring cycle...');

    try {
      const pendingRewards = await this.rewardRepository.find({
        where: [{ status: 'pending' }, { status: 'processing' }],
      });

      if (pendingRewards.length === 0) {
        this.logger.debug('No pending rewards to monitor');
        return;
      }

      this.logger.log(
        `Monitoring ${pendingRewards.length} pending/processing reward(s)`,
      );

      for (const reward of pendingRewards) {
        await this.checkRewardStatus(reward);
      }

      this.logger.log(
        `Completed monitoring cycle for ${pendingRewards.length} reward(s)`,
      );
    } catch (error) {
      this.logger.error('Error during transaction monitoring cycle:', error);
    }
  }

  /**
   * Check the status of a specific reward's blockchain transaction.
   * Updates the reward record based on the transaction result.
   */
  private async checkRewardStatus(reward: Reward): Promise<void> {
    try {
      if (!reward.transactionHash) {
        this.logger.warn(
          `Reward ${reward.id} has no transaction hash, marking as failed`,
        );
        reward.status = 'failed';
        reward.metadata = JSON.stringify({
          error: 'No transaction hash recorded',
        });
        await this.rewardRepository.save(reward);
        return;
      }

      const txStatus = await this.stellarService.getTransactionStatus(
        reward.transactionHash,
      );

      if (txStatus.status === 'SUCCESS') {
        reward.status = 'completed';
        reward.processedAt = new Date();
        this.logger.log(
          `Reward ${reward.id} confirmed on blockchain (tx: ${reward.transactionHash})`,
        );
      } else if (txStatus.status === 'FAILED') {
        reward.status = 'failed';
        reward.processedAt = new Date();
        this.logger.warn(
          `Reward ${reward.id} transaction failed (tx: ${reward.transactionHash})`,
        );
      } else {
        // Status is still NOT_FOUND or PENDING - leave as is
        this.logger.debug(
          `Reward ${reward.id} transaction status: ${txStatus.status}`,
        );
        return;
      }

      await this.rewardRepository.save(reward);
    } catch (error) {
      this.logger.error(
        `Error checking status for reward ${reward.id}:`,
        error,
      );

      // Mark as failed if we can't check status
      reward.status = 'failed';
      reward.metadata = JSON.stringify({
        error: error.message,
        lastChecked: new Date().toISOString(),
      });
      await this.rewardRepository.save(reward);
    }
  }

  // ─── Manual Checks ────────────────────────────────────────────────────────────
  /**
   * Manually check the status of a specific reward transaction.
   * Useful for API endpoints or manual intervention.
   */
  async monitorSpecificTransaction(rewardId: string): Promise<Reward> {
    try {
      const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });
      if (!reward) {
        this.logger.warn(`Reward ${rewardId} not found`);
        throw new Error(`Reward ${rewardId} not found`);
      }

      await this.checkRewardStatus(reward);
      return this.rewardRepository.findOne({ where: { id: rewardId } });
    } catch (error) {
      this.logger.error(
        `Error monitoring specific transaction for reward ${rewardId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get transaction history for an account.
   * Currently a placeholder - full Horizon integration needed.
   */
  async getTransactionHistory(accountId: string): Promise<any[]> {
    try {
      // TODO: Integrate with Stellar Horizon API to fetch full transaction history
      // For now, return empty array
      this.logger.debug(
        `Transaction history requested for account ${accountId}`,
      );
      return [];
    } catch (error) {
      this.logger.error(
        `Error fetching transaction history for account ${accountId}:`,
        error,
      );
      throw error;
    }
  }

  // ─── Retry Logic ──────────────────────────────────────────────────────────────
  /**
   * Retry all failed rewards by resetting them to pending status.
   * Can be called manually or via a separate cron job.
   */
  async retryFailedTransactions(): Promise<void> {
    this.logger.log('Starting retry of failed transactions...');

    try {
      const failedRewards = await this.rewardRepository.find({
        where: { status: 'failed' },
      });

      if (failedRewards.length === 0) {
        this.logger.log('No failed rewards to retry');
        return;
      }

      this.logger.log(`Retrying ${failedRewards.length} failed reward(s)`);

      for (const reward of failedRewards) {
        try {
          if (reward.type === 'token' && reward.amount) {
            await this.redistributeTokenReward(reward);
          } else if (reward.type === 'nft' && reward.tokenId) {
            await this.remintNFT(reward);
          } else if (reward.type === 'achievement') {
            // Achievement rewards are typically just token distributions
            await this.redistributeTokenReward(reward);
          } else {
            this.logger.warn(
              `Unknown reward type for retry: ${reward.type} (id: ${reward.id})`,
            );
          }
        } catch (retryError) {
          this.logger.error(
            `Failed to retry reward ${reward.id}:`,
            retryError,
          );
        }
      }

      this.logger.log(`Completed retry attempt for ${failedRewards.length} reward(s)`);
    } catch (error) {
      this.logger.error('Error during failed transaction retry:', error);
    }
  }

  /**
   * Reset a failed token reward to pending status for retry.
   * Preserves original error in metadata for audit trail.
   */
  private async redistributeTokenReward(reward: Reward): Promise<void> {
    const originalError = reward.metadata;

    reward.status = 'pending';
    reward.processedAt = null;
    reward.metadata = JSON.stringify({
      retryAttempt: true,
      originalError,
      retryTimestamp: new Date().toISOString(),
    });

    await this.rewardRepository.save(reward);
    this.logger.log(`Reset token reward ${reward.id} to pending for retry`);
  }

  /**
   * Reset a failed NFT reward to pending status for retry.
   * Preserves original error in metadata for audit trail.
   */
  private async remintNFT(reward: Reward): Promise<void> {
    const originalError = reward.metadata;

    reward.status = 'pending';
    reward.processedAt = null;
    reward.metadata = JSON.stringify({
      retryAttempt: true,
      originalError,
      retryTimestamp: new Date().toISOString(),
    });

    await this.rewardRepository.save(reward);
    this.logger.log(`Reset NFT reward ${reward.id} to pending for retry`);
  }
}
