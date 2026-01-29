import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NFT } from '../entities/nft.entity';
import { StellarService } from './stellar.service';
import { ConfigService } from '@nestjs/config';
import { xdr, nativeToScVal, Address } from '@stellar/stellar-sdk';

@Injectable()
export class NFTService {
  private readonly logger = new Logger(NFTService.name);
  private nftContractId: string;

  constructor(
    @InjectRepository(NFT)
    private nftRepository: Repository<NFT>,
    private stellarService: StellarService,
    private configService: ConfigService,
  ) {
    this.nftContractId = this.configService.get<string>('NFT_CONTRACT_ID');
  }

  async mintNFT(ownerId: string, name: string, description: string, imageUrl: string, metadata?: any): Promise<NFT> {
    // Find the next available token ID
    const lastNFT = await this.nftRepository.findOne({
      order: { tokenId: 'DESC' },
    });
    
    const tokenId = lastNFT ? lastNFT.tokenId + 1 : 1;
    
    // Create NFT record in database
    const nft = new NFT();
    nft.tokenId = tokenId;
    nft.ownerId = ownerId;
    nft.contractId = this.nftContractId;
    nft.name = name;
    nft.description = description;
    nft.imageUrl = imageUrl;
    nft.metadata = metadata || {};
    nft.status = 'active';
    nft.createdAt = new Date();
    nft.mintedAt = new Date();

    const savedNFT = await this.nftRepository.save(nft);

    try {
      // Mint NFT on Stellar blockchain
      const uri = `ipfs://${savedNFT.id}`; // Use IPFS URI or other decentralized storage
      const params = [
        new Address(ownerId).toScVal(),
        nativeToScVal(tokenId, { type: 'u64' }),
        nativeToScVal(uri, { type: 'string' }),
      ];

      const result = await this.stellarService.invokeContract(
        this.nftContractId,
        'mint',
        params,
      );

      // Update NFT record with transaction details
      savedNFT.status = result.status === 'SUCCESS' ? 'active' : 'failed';
      savedNFT.transactionHash = result.hash;
      savedNFT.mintedAt = new Date();
      
      return await this.nftRepository.save(savedNFT);
    } catch (error) {
      this.logger.error(`Error minting NFT for user ${ownerId}:`, error);
      savedNFT.status = 'failed';
      savedNFT.metadata = { ...savedNFT.metadata, error: error.message };
      return await this.nftRepository.save(savedNFT);
    }
  }

  async getNFT(tokenId: number): Promise<NFT> {
    return await this.nftRepository.findOneOrFail({ where: { tokenId } });
  }

  async getNFTsByOwner(ownerId: string): Promise<NFT[]> {
    return await this.nftRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async transferNFT(currentOwnerId: string, newOwnerId: string, tokenId: number): Promise<NFT> {
    const nft = await this.nftRepository.findOneOrFail({ 
      where: { tokenId, ownerId: currentOwnerId } 
    });

    // Transfer NFT on Stellar blockchain
    const params = [
      new Address(currentOwnerId).toScVal(),
      new Address(newOwnerId).toScVal(),
      nativeToScVal(tokenId, { type: 'u64' }),
    ];

    const result = await this.stellarService.invokeContract(
      this.nftContractId,
      'transfer',
      params,
    );

    // Update NFT record
    nft.ownerId = newOwnerId;
    nft.status = result.status === 'SUCCESS' ? 'active' : 'failed';
    nft.transactionHash = result.hash;
    nft.transferredAt = new Date();
    
    return await this.nftRepository.save(nft);
  }

  async burnNFT(ownerId: string, tokenId: number): Promise<NFT> {
    const nft = await this.nftRepository.findOneOrFail({ 
      where: { tokenId, ownerId } 
    });

    // Burn NFT on Stellar blockchain (if contract supports it)
    const params = [
      new Address(ownerId).toScVal(),
      nativeToScVal(tokenId, { type: 'u64' }),
    ];

    const result = await this.stellarService.invokeContract(
      this.nftContractId,
      'burn', // Assuming the contract has a burn function
      params,
    );

    // Update NFT record
    nft.status = result.status === 'SUCCESS' ? 'burned' : 'failed';
    nft.transactionHash = result.hash;
    
    return await this.nftRepository.save(nft);
  }
}