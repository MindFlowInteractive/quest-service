import { Controller, Post, Body } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { RewardsService } from '../rewards/rewards.service';
import { NFTService } from '../nft/nft.service';

@Controller('puzzle')
export class PuzzleController {
  constructor(
    private readonly puzzleService: PuzzleService,
    private readonly rewardsService: RewardsService,
    private readonly nftService: NFTService,
  ) {}

  @Post('create')
  async create(@Body() body: { puzzleId: number; solution: string }) {
    return this.puzzleService.createPuzzle(body.puzzleId, body.solution);
  }

  @Post('verify')
  async verify(@Body() body: { puzzleId: number; solution: string; userAddress: string }) {
    const verification = await this.puzzleService.verifySolution(
      body.puzzleId,
      body.solution,
    );

    if (verification.verified) {
      // Mark puzzle as completed
      await this.puzzleService.markCompleted(body.puzzleId, body.userAddress);

      // Distribute token rewards
      const rewardResult = await this.rewardsService.distributeReward(body.userAddress, 100);

      // Mint NFT as achievement
      const nftResult = await this.nftService.mintNFT(
        body.userAddress,
        Date.now(),
        `ipfs://puzzle-${body.puzzleId}-achievement`,
      );

      return {
        ...verification,
        rewardDistributed: rewardResult.success,
        rewardTransactionHash: rewardResult.transactionHash,
        nftMinted: nftResult.success,
        nftTransactionHash: nftResult.transactionHash,
      };
    }

    return verification;
  }
}
