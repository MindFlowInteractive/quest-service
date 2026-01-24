import { Injectable } from '@nestjs/common';
import { SorobanService } from '../soroban/soroban.service';
import { ConfigService } from '@nestjs/config';
import { nativeToScVal, Address } from '@stellar/stellar-sdk';

@Injectable()
export class RewardsService {
  private rewardContractId: string;

  constructor(
    private sorobanService: SorobanService,
    private configService: ConfigService,
  ) {
    this.rewardContractId = this.configService.get<string>('REWARD_CONTRACT_ID');
  }

  async distributeReward(userAddress: string, amount: number) {
    const params = [
      new Address(userAddress).toScVal(),
      nativeToScVal(BigInt(amount) * 10000000n, { type: 'i128' }), // Convert to stroops
    ];

    const result = await this.sorobanService.invokeContract(
      this.rewardContractId,
      'distribute_reward',
      params,
    );

    return {
      success: result.status === 'SUCCESS',
      transactionHash: result.hash,
      recipient: userAddress,
      amount,
    };
  }

  async getUserRewards(userAddress: string) {
    const params = [new Address(userAddress).toScVal()];

    const result = (await this.sorobanService.invokeContract(
      this.rewardContractId,
      'get_user_rewards',
      params,
    )) as any;

    return result.result;
  }
}
