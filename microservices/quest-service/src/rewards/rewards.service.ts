import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { RewardCalculationService } from './reward-calculation.service';
import { SorobanTokenService } from './soroban-token.service';
import { RewardQueueService } from './reward-queue.service';
import { BatchRewardDistributionService } from './batch-reward-distribution.service';
import { TransactionSubmissionService } from './transaction-submission.service';

interface GetUserRewardsOptions {
  type?: 'token' | 'nft' | 'achievement' | 'bonus';
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  limit: number;
  offset: number;
}

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    private rewardCalculationService: RewardCalculationService,
    private sorobanTokenService: SorobanTokenService,
    private rewardQueueService: RewardQueueService,
    private batchRewardDistributionService: BatchRewardDistributionService,
    private transactionSubmissionService: TransactionSubmissionService,
  ) {}

  async handlePuzzleCompletion(
    userId: string,
    puzzleId: string,
    completionTime?: number,
    hintsUsed?: number,
  ): Promise<{ success: boolean; rewardAmount?: number; message: string }> {
    try {
      // Calculate the reward based on puzzle difficulty and completion factors
      const rewardAmount = await this.rewardCalculationService.calculatePuzzleReward(
        puzzleId,
        completionTime,
        hintsUsed
      );

      // Add the reward to the queue for processing
      await this.rewardQueueService.addToQueue(
        userId,
        'token',
        rewardAmount,
        puzzleId,
        'normal'
      );

      this.logger.log(`Scheduled reward of ${rewardAmount} tokens for user ${userId} for completing puzzle ${puzzleId}`);

      return {
        success: true,
        rewardAmount,
        message: `Reward of ${rewardAmount} tokens scheduled for puzzle completion`,
      };
    } catch (error) {
      this.logger.error(`Error handling puzzle completion for user ${userId}, puzzle ${puzzleId}:`, error);
      return {
        success: false,
        message: `Error processing puzzle completion: ${error.message}`,
      };
    }
  }

  async getUserRewards(userId: string, options: GetUserRewardsOptions): Promise<Reward[]> {
    const where: any = { userId };
    
    if (options.type) {
      where.type = options.type;
    }
    
    if (options.status) {
      where.status = options.status;
    }

    return await this.rewardRepository.find({
      where,
      order: { createdAt: 'DESC' },
      skip: options.offset,
      take: options.limit,
    });
  }

  async claimReward(
    rewardId: string,
    walletAddress?: string,
  ): Promise<{ success: boolean; message: string; transactionHash?: string }> {
    try {
      const reward = await this.rewardRepository.findOne({
        where: { id: rewardId },
      });

      if (!reward) {
        return {
          success: false,
          message: 'Reward not found',
        };
      }

      if (reward.status !== 'pending') {
        return {
          success: false,
          message: `Reward is already ${reward.status}`,
        };
      }

      // Update reward status to processing
      await this.rewardRepository.update(rewardId, {
        status: 'processing',
        updatedAt: new Date(),
      });

      // If no wallet address provided, use default logic to get user's wallet
      if (!walletAddress) {
        const userWalletAddress = await this.getUserWalletAddress(reward.userId);
        if (!userWalletAddress) {
          throw new Error(`No wallet address found for user ${reward.userId}`);
        }
        walletAddress = userWalletAddress;
      }

      if (!walletAddress) {
        throw new Error(`No wallet address found for user ${reward.userId}`);
      }

      // Distribute the reward
      const distributionResult = await this.distributeReward(
        reward.userId,
        reward.amount,
        rewardId,
        walletAddress
      );

      if (distributionResult.success) {
        // Update reward status to completed
        await this.rewardRepository.update(rewardId, {
          status: 'completed',
          transactionHash: distributionResult.transactionHash,
          claimedAt: new Date(),
          updatedAt: new Date(),
        });

        return {
          success: true,
          message: 'Reward claimed successfully',
          transactionHash: distributionResult.transactionHash,
        };
      } else {
        // Update reward status to failed
        await this.rewardRepository.update(rewardId, {
          status: 'failed',
          metadata: JSON.stringify({ error: distributionResult.error }),
          updatedAt: new Date(),
        });

        return {
          success: false,
          message: `Failed to claim reward: ${distributionResult.error}`,
        };
      }
    } catch (error) {
      this.logger.error(`Error claiming reward ${rewardId}:`, error);
      
      // Update reward status to failed
      await this.rewardRepository.update(rewardId, {
        status: 'failed',
        metadata: JSON.stringify({ error: error.message }),
        updatedAt: new Date(),
      });

      return {
        success: false,
        message: `Error claiming reward: ${error.message}`,
      };
    }
  }

  private async distributeReward(
    userId: string,
    amount: number,
    rewardId: string,
    walletAddress: string,
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Check if user has an account on Stellar
      const accountExists = await this.checkAccountExists(walletAddress);
      if (!accountExists) {
        throw new Error(`Stellar account does not exist for user ${userId} with address ${walletAddress}`);
      }

      // Check the distributor's balance before attempting transfer
      const distributorAddress = await this.getDistributorWalletAddress();
      const distributorBalance = await this.sorobanTokenService.getTokenBalance(distributorAddress);
      
      if (distributorBalance < amount) {
        throw new Error(`Insufficient funds for distribution. Required: ${amount}, Available: ${distributorBalance}`);
      }

      // Transfer tokens
      const transferResult = await this.sorobanTokenService.transferTokens(walletAddress, amount);

      return {
        success: true,
        transactionHash: transferResult.hash,
      };
    } catch (error) {
      this.logger.error(`Error distributing reward ${rewardId} to user ${userId}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async getDistributorWalletAddress(): Promise<string> {
    // In a real implementation, this would return the wallet address of the reward distributor
    // For now, return a placeholder
    return 'GABCD1234567890'; // Placeholder distributor address
  }

  private async getUserWalletAddress(userId: string): Promise<string | null> {
    // In a real implementation, this would fetch the user's Stellar wallet address from a user profile service
    // For now, return a placeholder
    return `GB${'A'.repeat(50)}${userId.substring(0, 4)}`; // Placeholder address
  }

  private async checkAccountExists(walletAddress: string): Promise<boolean> {
    // In a real implementation, this would check if the account exists on the Stellar network
    // For now, assume all accounts exist
    return true;
  }

  async getUserQueuedRewards(userId: string): Promise<any[]> {
    return await this.rewardQueueService.getQueuedRewards(userId);
  }

  async getUserRewardHistory(userId: string, limit: number = 50): Promise<any[]> {
    return await this.rewardQueueService.getRewardHistory(userId, limit);
  }

  async getFailedRewards(userId?: string): Promise<any[]> {
    return await this.rewardQueueService.getFailedRewards(userId);
  }

  async retryFailedRewards(userId?: string): Promise<number> {
    return await this.rewardQueueService.retryFailedRewards(userId);
  }

  async processFailedRewardsWithRecovery(): Promise<void> {
    return await this.rewardQueueService.processFailedRewardsWithRecovery();
  }

  async getUserTokenBalance(userId: string): Promise<{ balance: number; available: number; pending: number }> {
    try {
      const walletAddress = await this.getUserWalletAddress(userId);
      if (!walletAddress) {
        throw new Error(`No wallet address found for user ${userId}`);
      }

      const balance = await this.sorobanTokenService.getTokenBalance(walletAddress);
      
      // Calculate pending rewards
      const pendingRewards = await this.rewardQueueService.getQueuedRewards(userId);
      const pendingAmount = pendingRewards.reduce((sum, reward) => sum + (reward.amount || 0), 0);

      return {
        balance,
        available: balance,
        pending: pendingAmount,
      };
    } catch (error) {
      this.logger.error(`Error getting token balance for user ${userId}:`, error);
      return {
        balance: 0,
        available: 0,
        pending: 0,
      };
    }
  }
}