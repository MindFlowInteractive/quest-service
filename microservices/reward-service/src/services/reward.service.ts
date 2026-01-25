import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { StellarService } from './stellar.service';
import { ConfigService } from '@nestjs/config';
import { nativeToScVal, Address } from '@stellar/stellar-sdk';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);
  private rewardContractId: string;

  constructor(
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    private stellarService: StellarService,
    private configService: ConfigService,
  ) {
    this.rewardContractId = this.configService.get<string>('REWARD_CONTRACT_ID');
  }

  async distributeTokenReward(userId: string, amount: number, reason?: string): Promise<Reward> {
    // Create a pending reward record
    const reward = new Reward();
    reward.userId = userId;
    reward.type = 'token';
    reward.amount = amount;
    reward.reason = reason || 'token_distribution';
    reward.status = 'pending';
    reward.createdAt = new Date();

    const savedReward = await this.rewardRepository.save(reward);

    try {
      // Interact with Stellar blockchain to distribute tokens
      const params = [
        new Address(userId).toScVal(), // Assuming userId is a Stellar address
        nativeToScVal(BigInt(amount) * 10000000n, { type: 'i128' }), // Convert to stroops
      ];

      const result = await this.stellarService.invokeContract(
        this.rewardContractId,
        'distribute_reward',
        params,
      );

      // Update reward record with transaction details
      savedReward.status = result.status === 'SUCCESS' ? 'completed' : 'failed';
      savedReward.transactionHash = result.hash;
      savedReward.processedAt = new Date();
      
      return await this.rewardRepository.save(savedReward);
    } catch (error) {
      this.logger.error(`Error distributing token reward for user ${userId}:`, error);
      savedReward.status = 'failed';
      savedReward.metadata = JSON.stringify({ error: error.message });
      return await this.rewardRepository.save(savedReward);
    }
  }

  async getRewardsByUser(userId: string): Promise<Reward[]> {
    return await this.rewardRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRewardById(id: string): Promise<Reward> {
    return await this.rewardRepository.findOneOrFail({ where: { id } });
  }

  async getUserTokenBalance(userAddress: string): Promise<any> {
    try {
      const params = [new Address(userAddress).toScVal()];
      
      const result = await this.stellarService.invokeContract(
        this.rewardContractId,
        'get_user_rewards',
        params,
      );

      return result.result;
    } catch (error) {
      this.logger.error(`Error getting token balance for user ${userAddress}:`, error);
      throw error;
    }
  }

  async processScheduledRewards(): Promise<void> {
    // Process pending rewards that might have failed previously
    const pendingRewards = await this.rewardRepository.find({
      where: { status: 'pending' },
    });

    for (const reward of pendingRewards) {
      try {
        if (reward.type === 'token' && reward.amount) {
          const params = [
            new Address(reward.userId).toScVal(),
            nativeToScVal(BigInt(reward.amount) * 10000000n, { type: 'i128' }),
          ];

          const result = await this.stellarService.invokeContract(
            this.rewardContractId,
            'distribute_reward',
            params,
          );

          reward.status = result.status === 'SUCCESS' ? 'completed' : 'failed';
          reward.transactionHash = result.hash;
          reward.processedAt = new Date();
          
          await this.rewardRepository.save(reward);
        }
      } catch (error) {
        this.logger.error(`Error processing scheduled reward ${reward.id}:`, error);
        reward.status = 'failed';
        reward.metadata = JSON.stringify({ error: error.message });
        await this.rewardRepository.save(reward);
      }
    }
  }
}