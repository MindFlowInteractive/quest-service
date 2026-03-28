import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';

import { PuzzleService } from './puzzle.service';
import { PuzzlesService } from './puzzles.service';
import { RewardsService } from '../rewards/rewards.service';
import { NFTService } from '../nft/nft.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PuzzleSearchParams } from './puzzles.repository';

interface AuthRequest extends Request {
  user: {
    id: string;
  };
}

@Controller('puzzles')
@UseGuards(JwtAuthGuard)
export class PuzzleController {
  constructor(
    private readonly puzzleService: PuzzleService,
    private readonly puzzlesService: PuzzlesService,
    private readonly rewardsService: RewardsService,
    private readonly nftService: NFTService,
  ) {}

  /**
   * CREATE PUZZLE
   */
  @Post('create')
  async create(
    @Body()
    body: {
      puzzleId: number;
      solution: string;
    },
  ) {
    return this.puzzleService.createPuzzle(body.puzzleId, body.solution);
  }

  /**
   * VERIFY SOLUTION + REWARDS + NFT MINT
   */
  @Post('verify')
  async verify(
    @Body()
    body: {
      puzzleId: number;
      solution: string;
      userAddress: string;
    },
  ) {
    const verification = await this.puzzleService.verifySolution(
      body.puzzleId,
      body.solution,
    );

    if (!verification.verified) {
      return verification;
    }

    // mark completion
    await this.puzzleService.markCompleted(
      body.puzzleId,
      body.userAddress,
    );

    // rewards distribution
    const rewardResult =
      await this.rewardsService.distributeReward(
        body.userAddress,
        100,
      );

    // NFT minting
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

  /**
   * SEARCH PUZZLES (from repository-based system)
   */
  @Get('search')
  async search(
    @Query(new ValidationPipe({ transform: true }))
    query: PuzzleSearchParams,
    @Req() req: AuthRequest,
  ) {
    return this.puzzlesService.search(query, req.user.id);
  }
}