import { Injectable } from '@nestjs/common';
import { SorobanService } from '../soroban/soroban.service';
import { ConfigService } from '@nestjs/config';
import { nativeToScVal, Address } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

@Injectable()
export class PuzzleService {
  private puzzleContractId: string;

  constructor(
    private sorobanService: SorobanService,
    private configService: ConfigService,
  ) {
    this.puzzleContractId = this.configService.get<string>('PUZZLE_CONTRACT_ID');
  }

  async createPuzzle(puzzleId: number, solution: string) {
    // Hash the solution before storing
    const solutionHash = crypto
      .createHash('sha256')
      .update(solution)
      .digest('hex');

    const params = [
      nativeToScVal(puzzleId, { type: 'u64' }),
      nativeToScVal(solutionHash, { type: 'string' }),
    ];

    const result = await this.sorobanService.invokeContract(
      this.puzzleContractId,
      'create_puzzle',
      params,
    );

    return {
      success: result.status === 'SUCCESS',
      puzzleId,
      transactionHash: result.hash,
    };
  }

  async verifySolution(puzzleId: number, solution: string) {
    const params = [
      nativeToScVal(puzzleId, { type: 'u64' }),
      nativeToScVal(solution, { type: 'string' }),
    ];

    const result = await this.sorobanService.invokeContract(
      this.puzzleContractId,
      'verify_solution',
      params,
    );

    return {
      verified: result.status === 'SUCCESS',
      puzzleId,
      transactionHash: result.hash,
    };
  }

  async markCompleted(puzzleId: number, userAddress: string) {
    const params = [
      nativeToScVal(puzzleId, { type: 'u64' }),
      new Address(userAddress).toScVal(),
    ];

    const result = await this.sorobanService.invokeContract(
      this.puzzleContractId,
      'mark_completed',
      params,
    );

    return {
      success: result.status === 'SUCCESS',
      puzzleId,
      user: userAddress,
      transactionHash: result.hash,
    };
  }
}
