import { Module } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { PuzzleController } from './puzzle.controller';
import { SorobanModule } from '../soroban/soroban.module';
import { NFTModule } from '../nft/nft.module';
import { RewardsModule } from '../rewards/rewards.module';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [SorobanModule, NFTModule, RewardsModule, CollectionsModule],
  controllers: [PuzzleController],
  providers: [PuzzleService],
})
export class PuzzleModule {}
