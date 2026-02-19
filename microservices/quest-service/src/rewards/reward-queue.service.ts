import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { RewardQueue } from './entities/reward-queue.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RewardQueueService implements OnModuleInit {
  private readonly logger = new Logger(RewardQueueService.name);

  constructor(
    @InjectRepository(RewardQueue)
    private rewardQueueRepository: Repository<RewardQueue>,
  ) {}

  async onModuleInit() {
    // Process any pending items when the module initializes
    await this.processPendingRewards();
  }

  async addToQueue(userId: string, type: 'token' | 'nft' | 'achievement' | 'bonus', amount?: number, puzzleId?: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'): Promise<RewardQueue> {
    const rewardQueue = new RewardQueue();
    rewardQueue.userId = userId;
    rewardQueue.type = type;
    rewardQueue.amount = amount;
    rewardQueue.puzzleId = puzzleId;
    rewardQueue.priority = priority;
    rewardQueue.status = 'pending';
    rewardQueue.scheduledAt = new Date(); // Schedule for immediate processing
    
    return await this.rewardQueueRepository.save(rewardQueue);
  }

  async processPendingRewards(): Promise<void> {
    this.logger.log('Processing pending rewards from queue...');
    
    // Get pending rewards ordered by priority and scheduled time
    const pendingRewards = await this.rewardQueueRepository.find({
      where: {
        status: 'pending',
        scheduledAt: MoreThanOrEqual(new Date()),
      },
      order: {
        priority: this.getPriorityOrder(),
        scheduledAt: 'ASC',
      },
      take: 50, // Process up to 50 at a time
    });

    for (const reward of pendingRewards) {
      try {
        await this.processSingleReward(reward);
      } catch (error) {
        this.logger.error(`Error processing reward queue item ${reward.id}:`, error);
        await this.markAsFailed(reward.id, error.message);
      }
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES) // Process queue every 5 minutes
  async handleCron() {
    await this.processPendingRewards();
  }

  private async processSingleReward(reward: RewardQueue): Promise<void> {
    try {
      this.logger.log(`Processing reward queue item ${reward.id} for user ${reward.userId}`);
      
      // Update status to processing
      await this.rewardQueueRepository.update(reward.id, { 
        status: 'processing',
        updatedAt: new Date()
      });

      // Simulate reward processing - in a real implementation, this would interact with the blockchain
      // Here we would call the token distribution service
      await this.simulateTokenTransfer(reward);

      // Mark as completed
      await this.rewardQueueRepository.update(reward.id, { 
        status: 'completed',
        processedAt: new Date(),
        updatedAt: new Date()
      });

      this.logger.log(`Successfully processed reward queue item ${reward.id}`);
    } catch (error) {
      this.logger.error(`Failed to process reward queue item ${reward.id}:`, error);
      
      // Check retry count
      if (reward.retryCount < 3) { // Max 3 retries
        await this.rewardQueueRepository.update(reward.id, { 
          retryCount: reward.retryCount + 1,
          status: 'pending', // Reset to pending for retry
          scheduledAt: new Date(Date.now() + (1000 * 60 * Math.pow(2, reward.retryCount))), // Exponential backoff
          errorMessage: error.message,
          updatedAt: new Date()
        });
        
        this.logger.log(`Scheduled retry for reward queue item ${reward.id}, attempt ${reward.retryCount + 1}`);
      } else {
        await this.markAsFailed(reward.id, error.message);
      }
      
      throw error; // Re-throw to be caught by the parent function
    }
  }

  async retryFailedRewards(userId?: string): Promise<number> {
    const where: any = { status: 'failed' };
    if (userId) {
      where.userId = userId;
    }
    
    const failedRewards = await this.rewardQueueRepository.find({
      where,
      take: 50, // Retry up to 50 at a time
    });

    let retriedCount = 0;
    for (const reward of failedRewards) {
      try {
        // Reset the reward to pending status with incremented retry count
        await this.rewardQueueRepository.update(reward.id, {
          status: 'pending',
          retryCount: reward.retryCount + 1,
          errorMessage: null,
          scheduledAt: new Date(),
          updatedAt: new Date(),
        });
        
        retriedCount++;
      } catch (error) {
        this.logger.error(`Failed to reset failed reward ${reward.id} for retry:`, error);
      }
    }

    this.logger.log(`Reset ${retriedCount} failed rewards for retry`);
    return retriedCount;
  }

  async getFailedRewards(userId?: string): Promise<RewardQueue[]> {
    const where: any = { status: 'failed' };
    if (userId) {
      where.userId = userId;
    }
    
    return await this.rewardQueueRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async processFailedRewardsWithRecovery(): Promise<void> {
    this.logger.log('Processing failed rewards with recovery...');
    
    const failedRewards = await this.getFailedRewards();
    
    for (const reward of failedRewards) {
      try {
        // Only retry if we haven't exceeded the max retry count
        if (reward.retryCount < 5) { // Allow up to 5 total attempts (original + 4 retries)
          await this.rewardQueueRepository.update(reward.id, {
            status: 'pending',
            retryCount: reward.retryCount + 1,
            errorMessage: null,
            scheduledAt: new Date(Date.now() + (1000 * 60 * Math.pow(2, reward.retryCount))), // Exponential backoff
            updatedAt: new Date(),
          });
          
          this.logger.log(`Scheduled failed reward ${reward.id} for retry (attempt ${reward.retryCount + 1})`);
        } else {
          this.logger.log(`Max retry attempts reached for reward ${reward.id}, leaving as failed`);
        }
      } catch (error) {
        this.logger.error(`Error scheduling failed reward ${reward.id} for retry:`, error);
      }
    }
  }

  private async simulateTokenTransfer(reward: RewardQueue): Promise<void> {
    // This is a placeholder - in a real implementation, this would call the actual token transfer service
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.log(`Simulated token transfer of ${reward.amount} tokens to user ${reward.userId}`);
  }

  private async markAsFailed(rewardId: string, errorMessage: string): Promise<void> {
    await this.rewardQueueRepository.update(rewardId, { 
      status: 'failed',
      errorMessage,
      updatedAt: new Date()
    });
  }

  private getPriorityOrder(): 'DESC' | 'ASC' {
    // Critical and high priority first
    return 'DESC';
  }

  async getQueuedRewards(userId?: string): Promise<RewardQueue[]> {
    const where: any = { status: 'pending' };
    if (userId) {
      where.userId = userId;
    }
    
    return await this.rewardQueueRepository.find({
      where,
      order: {
        priority: this.getPriorityOrder(),
        scheduledAt: 'ASC',
      },
    });
  }

  async getRewardHistory(userId?: string, limit = 50): Promise<RewardQueue[]> {
    const where: any = {
      status: ['completed', 'failed'],
    };
    
    if (userId) {
      where.userId = userId;
    }
    
    return await this.rewardQueueRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async cancelReward(rewardId: string): Promise<void> {
    await this.rewardQueueRepository.update(rewardId, { 
      status: 'cancelled',
      updatedAt: new Date()
    });
  }
}