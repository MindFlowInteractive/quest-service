import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { SorobanTokenService } from './soroban-token.service';
import { RewardQueueService } from './reward-queue.service';

@Injectable()
export class BatchRewardDistributionService {
  private readonly logger = new Logger(BatchRewardDistributionService.name);

  constructor(
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    private sorobanTokenService: SorobanTokenService,
    private rewardQueueService: RewardQueueService,
  ) {}

  async distributeBatchRewards(rewards: Array<{
    userId: string,
    amount: number,
    puzzleId?: string,
    reason?: string
  }>): Promise<{ success: boolean, transactionHash?: string, error?: string }[]> {
    const results: { success: boolean, transactionHash?: string, error?: string }[] = [];

    for (const rewardData of rewards) {
      try {
        const result = await this.distributeRewardToUser(
          rewardData.userId,
          rewardData.amount,
          rewardData.puzzleId,
          rewardData.reason
        );
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to distribute reward to user ${rewardData.userId}:`, error);
        results.push({
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async distributeRewardToUser(
    userId: string,
    amount: number,
    puzzleId?: string,
    reason?: string
  ): Promise<{ success: boolean, transactionHash?: string, error?: string }> {
    try {
      // In a real implementation, we'd get the user's Stellar wallet address
      // For now, we'll use a placeholder address
      const userWalletAddress = await this.getUserWalletAddress(userId);
      
      if (!userWalletAddress) {
        throw new Error(`No wallet address found for user ${userId}`);
      }

      // Check if user has an account on Stellar
      const accountExists = await this.checkAccountExists(userWalletAddress);
      if (!accountExists) {
        throw new Error(`Stellar account does not exist for user ${userId} with address ${userWalletAddress}`);
      }

      // Transfer tokens
      const transferResult = await this.sorobanTokenService.transferTokens(userWalletAddress, amount);

      // Save reward record
      const reward = new Reward();
      reward.userId = userId;
      reward.type = 'token';
      reward.amount = amount;
      reward.puzzleId = puzzleId;
      reward.reason = reason || 'puzzle_completion';
      reward.status = 'completed';
      reward.transactionHash = transferResult.hash;
      reward.createdAt = new Date();

      await this.rewardRepository.save(reward);

      this.logger.log(`Successfully distributed ${amount} tokens to user ${userId} for puzzle ${puzzleId}`);

      return {
        success: true,
        transactionHash: transferResult.hash
      };
    } catch (error) {
      this.logger.error(`Error distributing reward to user ${userId}:`, error);

      // Save failed reward record
      const reward = new Reward();
      reward.userId = userId;
      reward.type = 'token';
      reward.amount = amount;
      reward.puzzleId = puzzleId;
      reward.reason = reason || 'puzzle_completion';
      reward.status = 'failed';
      reward.metadata = JSON.stringify({ error: error.message });
      reward.createdAt = new Date();

      await this.rewardRepository.save(reward);

      return {
        success: false,
        error: error.message
      };
    }
  }

  async processBatchFromQueue(batchSize: number = 10): Promise<number> {
    // Get pending rewards from the queue
    const pendingRewards = await this.rewardQueueService.getQueuedRewards();
    
    if (pendingRewards.length === 0) {
      this.logger.log('No pending rewards to process');
      return 0;
    }

    // Take only up to batchSize items
    const rewardsToProcess = pendingRewards.slice(0, batchSize);

    let processedCount = 0;
    for (const reward of rewardsToProcess) {
      try {
        if (reward.type === 'token' && reward.amount) {
          await this.distributeRewardToUser(
            reward.userId,
            reward.amount,
            reward.puzzleId,
            `Batch distribution for puzzle ${reward.puzzleId}`
          );
          
          // Mark the queue item as processed
          await this.rewardQueueService.cancelReward(reward.id);
        }
        processedCount++;
      } catch (error) {
        this.logger.error(`Failed to process queued reward ${reward.id}:`, error);
      }
    }

    this.logger.log(`Processed ${processedCount} rewards from queue`);
    return processedCount;
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

  async scheduleBatchDistribution(rewards: Array<{
    userId: string,
    amount: number,
    puzzleId?: string,
    reason?: string
  }>): Promise<void> {
    for (const reward of rewards) {
      await this.rewardQueueService.addToQueue(
        reward.userId,
        'token',
        reward.amount,
        reward.puzzleId,
        'normal'
      );
    }
  }
}