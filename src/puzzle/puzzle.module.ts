import { Module } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { PuzzleController } from './puzzle.controller';
import { SorobanModule } from '../soroban/soroban.module';
import { NFTModule } from '../nft/nft.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [SorobanModule, NFTModule, RewardsModule],
  controllers: [PuzzleController],
  providers: [PuzzleService],
})
export class PuzzleModule {}
