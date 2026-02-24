import { Injectable } from '@nestjs/common';
import { SorobanContractService } from './stellar/soroban-contract.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NFTOwnership } from './entities/nft-ownership.entity';

@Injectable()
export class NFTMintingService {
  constructor(
    private readonly soroban: SorobanContractService,
    @InjectRepository(NFTOwnership)
    private readonly ownershipRepo: Repository<NFTOwnership>,
  ) {}

  async mintAchievementNFT(playerId: string, achievement: any) {
    const metadata = {
      title: achievement.title,
      description: achievement.description,
      image: achievement.image,
    };

    const result = await this.soroban.callMintFunction(playerId, metadata);

    if (result.success) {
      const ownership = this.ownershipRepo.create({
        playerId,
        tokenId: result.tokenId,
        metadata,
      });
      await this.ownershipRepo.save(ownership);
      return ownership;
    }

    throw new Error('NFT minting failed');
  }
}
