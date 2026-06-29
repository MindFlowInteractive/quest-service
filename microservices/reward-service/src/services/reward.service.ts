import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from '../entities/reward.entity';
import { StellarService } from './stellar.service';
import { ConfigService } from '@nestjs/config';
import { nativeToScVal, Address } from '@stellar/stellar-sdk';

@Injectable()
export class RewardService {
  private readonly logger = new Logger(RewardService.name);
  private readonly rewardContractId: string;

  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    private readonly stellarService: StellarService,
    private readonly configService: ConfigService,
  ) {
    this.rewardContractId = this.configService.get<string>('REWARD_CONTRACT_ID');
  }

  // ─── Token Distribution ──────────────────────────────────────────────────────
  /**
   * pending reward record
   * @param userId recipient wallet address
   * @param amount token amount call the Stellar contract, then update
   * the record with the final on-chain status.
   * @param reason optional reason for reward
   * @returns Reward record
   *
   * Amount is stored as whole tokens in the DB and converted to stroops
   * (1 token = 10_000_000 stroops) for the contract call.
   */
  async distributeTokenReward(
    userId: string,
    amount: number,
    reason?: string,
  ): Promise<Reward> {
    // Persist before touching the chain we must never lose the intent
    const reward = this.rewardRepository.create({
      userId,
      type: 'token',
      amount,
      reason: reason ?? 'token_distribution',
      status: 'pending',
    });

    const saved = await this.rewardRepository.save(reward);

    try {
      const params = [
        new Address(userId).toScVal(),
        nativeToScVal(BigInt(Math.round(amount)) * 10_000_000n, {
          type: 'i128',
        }),
      ];

      const result = await this.stellarService.invokeContract(
        this.rewardContractId,
        'distribute_reward',
        params,
      );

      saved.status = result.status === 'SUCCESS' ? 'completed' : 'failed';
      saved.transactionHash = result.hash;
      saved.processedAt = new Date();
      return this.rewardRepository.save(saved);
    } catch (error) {
      this.logger.error(
        `Error distributing token reward for user ${userId}:`,
        error,
      );
      saved.status = 'failed';
      saved.metadata = JSON.stringify({ error: error.message });
      return this.rewardRepository.save(saved);
    }
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  async getRewardsByUser(userId: string): Promise<Reward[]> {
    return this.rewardRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRewardById(id: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });
    if (!reward) throw new NotFoundException(`Reward ${id} not found`);
    return reward;
  }

  async getUserTokenBalance(userAddress: string): Promise<any> {
    const params = [new Address(userAddress).toScVal()];
    const result = await this.stellarService.invokeContract(
      this.rewardContractId,
      'get_user_rewards',
      params,
    );
    return result.result;
  }

  // ─── Scheduled Retry ─────────────────────────────────────────────────────────
  /**
   * Re-attempt all rewards that are still in 'pending' status.
   * Called by a cron job or by TransactionMonitoringService.retryFailedTransactions().
   */
  async processScheduledRewards(): Promise<void> {
    const pendingRewards = await this.rewardRepository.find({
      where: { status: 'pending' },
    });

    this.logger.log(
      `processScheduledRewards: ${pendingRewards.length} pending reward(s)`,
    );

    for (const reward of pendingRewards) {
      try {
        if (reward.type === 'token' && reward.amount) {
          const params = [
            new Address(reward.userId).toScVal(),
            nativeToScVal(
              BigInt(Math.round(Number(reward.amount))) * 10_000_000n,
              { type: 'i128' },
            ),
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
        this.logger.error(
          `Error processing scheduled reward ${reward.id}:`,
          error,
        );
        reward.status = 'failed';
        reward.metadata = JSON.stringify({ error: error.message });
        await this.rewardRepository.save(reward);
      }
    }
  }
}
