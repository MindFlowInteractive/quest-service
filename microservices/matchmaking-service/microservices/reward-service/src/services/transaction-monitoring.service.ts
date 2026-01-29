import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { StellarService } from './stellar.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TransactionMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(TransactionMonitoringService.name);

  constructor(
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    private stellarService: StellarService,
  ) {}

  async onModuleInit() {
    // Initialize monitoring when the module starts
    this.logger.log('Initializing transaction monitoring...');
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorPendingTransactions() {
    this.logger.log('Starting transaction monitoring cycle...');

    try {
      // Get all rewards with pending or processing status
      const pendingRewards = await this.rewardRepository.find({
        where: [
          { status: 'pending' },
          { status: 'processing' }
        ],
      });

      for (const reward of pendingRewards) {
        try {
          if (reward.transactionHash) {
            // Check the status of the blockchain transaction
            const txStatus = await this.stellarService.getTransactionStatus(reward.transactionHash);

            if (txStatus.status === 'SUCCESS') {
              // Update reward status to completed
              reward.status = 'completed';
              reward.processedAt = new Date();
              await this.rewardRepository.save(reward);

              this.logger.log(`Successfully updated reward ${reward.id} to completed status`);
            } else if (txStatus.status === 'FAILED') {
              // Update reward status to failed
              reward.status = 'failed';
              reward.processedAt = new Date();
              await this.rewardRepository.save(reward);

              this.logger.warn(`Reward ${reward.id} transaction failed`);
            }
          }
        } catch (error) {
          this.logger.error(`Error monitoring reward ${reward.id}:`, error);
          
          // Update reward status to failed due to monitoring error
          reward.status = 'failed';
          reward.metadata = JSON.stringify({ 
            error: error.message, 
            lastChecked: new Date().toISOString() 
          });
          await this.rewardRepository.save(reward);
        }
      }

      this.logger.log(`Completed monitoring of ${pendingRewards.length} pending rewards`);
    } catch (error) {
      this.logger.error('Error during transaction monitoring:', error);
    }
  }

  async monitorSpecificTransaction(rewardId: string) {
    try {
      const reward = await this.rewardRepository.findOneOrFail({ where: { id: rewardId } });

      if (reward.transactionHash) {
        const txStatus = await this.stellarService.getTransactionStatus(reward.transactionHash);

        if (txStatus.status === 'SUCCESS') {
          reward.status = 'completed';
          reward.processedAt = new Date();
        } else if (txStatus.status === 'FAILED') {
          reward.status = 'failed';
          reward.processedAt = new Date();
        }

        await this.rewardRepository.save(reward);
        return reward;
      }

      return reward;
    } catch (error) {
      this.logger.error(`Error monitoring specific transaction for reward ${rewardId}:`, error);
      throw error;
    }
  }

  async getTransactionHistory(accountId: string) {
    try {
      // Fetch transaction history from Stellar blockchain for the given account
      const transactions = await this.stellarService.getTransactionStatus(accountId);
      
      // Note: This is a simplified implementation. In reality, you'd need to query
      // Stellar's history endpoints to get a list of transactions for an account
      return [];
    } catch (error) {
      this.logger.error(`Error fetching transaction history for account ${accountId}:`, error);
      throw error;
    }
  }

  async retryFailedTransactions() {
    this.logger.log('Retrying failed transactions...');

    try {
      const failedRewards = await this.rewardRepository.find({
        where: { status: 'failed' },
      });

      for (const reward of failedRewards) {
        try {
          // Attempt to reprocess the failed reward based on its type
          if (reward.type === 'token' && reward.amount) {
            // For token rewards, try to redistribute
            await this.redistributeTokenReward(reward);
          } else if (reward.type === 'nft' && reward.tokenId) {
            // For NFT rewards, try to remint
            await this.remintNFT(reward);
          }

          this.logger.log(`Successfully retried reward ${reward.id}`);
        } catch (retryError) {
          this.logger.error(`Failed to retry reward ${reward.id}:`, retryError);
        }
      }
    } catch (error) {
      this.logger.error('Error during failed transaction retry:', error);
    }
  }

  private async redistributeTokenReward(reward: Reward) {
    // Implementation to redistribute a failed token reward
    // This would involve calling the Stellar service again with the same parameters
    const params = [
      // Implementation would depend on the original parameters
    ];
    
    // Reset the reward status to pending and try again
    reward.status = 'pending';
    reward.processedAt = null;
    reward.claimedAt = null;
    reward.metadata = JSON.stringify({ 
      retryAttempt: true,
      originalError: reward.metadata 
    });
    
    await this.rewardRepository.save(reward);
  }

  private async remintNFT(reward: Reward) {
    // Implementation to remint a failed NFT
    // Similar to redistributeTokenReward but for NFTs
    reward.status = 'pending';
    reward.processedAt = null;
    reward.metadata = JSON.stringify({ 
      retryAttempt: true,
      originalError: reward.metadata 
    });
    
    await this.rewardRepository.save(reward);
  }
}