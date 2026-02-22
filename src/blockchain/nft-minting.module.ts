import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NFTMintingService } from './nft-minting.service';
import { StellarService } from './stellar/stellar-service';
import { SorobanContractService } from './stellar/soroban-contract.service';
import { NFTOwnership } from './entities/nft-ownership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NFTOwnership])],
  providers: [
    NFTMintingService,
    StellarService,
    SorobanContractService,
  ],
  exports: [NFTMintingService],
})
export class NFTMintingModule {}
